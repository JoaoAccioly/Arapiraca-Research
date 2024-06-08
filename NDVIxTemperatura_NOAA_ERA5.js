// Seleciona uma localização
var geometry = ee.FeatureCollection(
  'projects/joaoaccioly/assets/Brazil_Municipalities_2022'
).filter(ee.Filter.eq('NM_MUN', 'Arapiraca'));
// Centraliza a região
Map.centerObject(geometry, 10);
/*
// Seleciona um período de tempo
var ano = 2000;
var dataInicio = ee.Date.fromYMD(ano, 1, 1);
var dataFim = dataInicio.advance(2, 'year');*/

var startYear = 1987;
var endYear = 1987;
var startDate = ee.Date.fromYMD(startYear, 1, 1);
var endDate = ee.Date.fromYMD(endYear + 1, 1, 1);

// Obtém NDVI do Sentinel-2
var temp_collection = ee.ImageCollection('ECMWF/ERA5_LAND/MONTHLY_AGGR');
function scale_and_temp(image) {
  var temp = image.select('temperature_2m');
  var Temperatura = temp.multiply(1).rename('Temp_s_c');
  return image
    .addBands(Temperatura)
    .clip(geometry)
    //.copyProperties(image, image.propertyNames())
    //.set({ data: image.date().format('YYYY-MM-dd') });
}
var temp_Filtrado = temp_collection
  .filter(ee.Filter.date(startDate, endDate))
  .filter(ee.Filter.bounds(geometry))
  .map(scale_and_temp);
  
function cor_temp(image) {
  var Temp = image.select('Temp_s_c')
  var Temp_cor = Temp.subtract(273).rename('Temperatura');
  return image.addBands(Temp_cor)
  //.copyProperties(image, image.propertyNames())
  //.set({ data: image.date().format('YYYY-MM-dd') });
}
var comTemp = temp_Filtrado.map(cor_temp);

// Obtém Precipitação do CHIRPS
function cor_ndvi(image) {
  var ndvi = image.select('NDVI')
  var Temp_cor = ndvi.multiply(0.0001).rename('NDVI_')
  //.copyProperties(image, image.propertyNames())
  //.set({ data: image.date().format('YYYY-MM-dd') });
  return image.addBands(Temp_cor);}
var ndvi_collection2 = ee.ImageCollection('NOAA/CDR/AVHRR/NDVI/V5').map(cor_ndvi);
var ndvi_collection = ndvi_collection2.select("NDVI_")
var ndviFiltrado = ndvi_collection
  .filter(ee.Filter.date(startDate, endDate));

// Cria uma coleção de imagens mensais
// com bandas para ndvi e precipitação
var meses = ee.List.sequence(1, 12);

var porMes = meses.map(function(mes) {
    var start = ee.Date.fromYMD(startYear, mes, 1);
    var end = start.advance(3, 'month');
  
    // Precipitação mensal total
    var NDVI = ndviFiltrado
      .filterDate(start, end);
    var ndviTotal = NDVI.mean();
  
    // NDVI médio
    var Temperatura = comTemp.select('Temperatura')
      .filterDate(start, end);
    var TempMedio = Temperatura.mean();
  
    return ndviTotal.addBands(TempMedio)
        .copyProperties(ndviTotal, TempMedio.propertyNames())
        .set({ 'system:time_start': start.millis() });
});
var colecaoMensal = ee.ImageCollection.fromImages(porMes);

print('Coleção Mensal com NDVI e Precipitação', colecaoMensal);

// Agora criamos um gráfico de séries temporais
// Como ambas as nossas bandas têm escalas diferentes,
// criaremos um gráfico com eixo Y duplo.
// Saiba mais em https://developers.google.com/chart/interactive/docs/gallery/columnchart#dual-y-charts
var grafico = ui.Chart.image.series({
  imageCollection: colecaoMensal,
  region: geometry,
  reducer: ee.Reducer.mean(),
  scale: 1000,
  xProperty:'system:time_start'
}).setChartType('LineChart')
  .setOptions({
    fontSize: 20 ,
    title: 'Monthly Collection with NDVI and Temperature (1987) - Arapiraca (AL) (ECMWF/ERA5 and NOAA/AVHRR)',
    titleTextStyle: { fontSize: 30 },
    lineWidth: 5,
    pointSize: 2,
    series: {
      0: {targetAxisIndex: 0, color: '#32CD32'},
      1: {targetAxisIndex: 1, color: '#FF0000'}, 
    },
    vAxes: {
      0: {title: 'NDVI', fontSize: 50,gridlines: {count: 5}, viewWindow: {min:0, max:1},
          titleTextStyle: { bold: true, color: '#32CD32' }},
      1: {title: 'Temperature (°C)',fontSize: 50 ,gridlines: {color: 'none'},
          titleTextStyle: { bold: true, color: '#FF0000' }},
      },
    hAxis: {
      gridlines:  {fontSize: 15 ,color: 'none'}
    },
      chartArea: {left: 500, right: 500}
});
print(grafico);

var grafico = ui.Chart.image.series({
  imageCollection: colecaoMensal,
  region: geometry,
  reducer: ee.Reducer.pearsonsCorrelation(),
  scale: 1000,
  xProperty:'system:time_start'
}).setChartType('LineChart')
  .setOptions({
    fontSize: 20,
    title: 'Pearsons Correlaction for NDVI and Temperatura (1987) - Arapiraca(AL) (ECMWF/ERA5 and NOAA/AVHRR)',
    titleTextStyle: { fontSize: 30 },
    lineWidth: 5,
    pointSize: 2,
    hAxis: {
      gridlines:  {color: 'none'}
    },
    chartArea: {left: 500, right: 500}
});
print(grafico);
