var roi = /* color: #d63000 */ee.Geometry.Point([-36.64212252698771, -9.985793341074537]),
    Ponto_urbano1 = 
    /* color: #98ff00 */
    /* shown: false */
    ee.Feature(
        ee.Geometry.Point([-36.655029840930474, -9.754294183720301]),
        {
          "system:index": "0",
          "label": "Ponto urbano frio",
          "classe": 3
        }),
    Ponto_urbano2 = 
    /* color: #0b19ff */
    /* shown: false */
    ee.Feature(
        ee.Geometry.Point([-36.650578613997865, -9.753611134213818]),
        {
          "system:index": "0",
          "classe": 2,
          "label": "Ponto urbano quente1"
        }),
    Ponto_urbano3 = 
    /* color: #fffd02 */
    /* shown: false */
    ee.Feature(
        ee.Geometry.Point([-36.65744820788441, -9.765604156333486]),
        {
          "system:index": "0",
          "label": "Ponto urbano quente 2",
          "classe": ""
        }),
    Ponto_fora_da_malha = 
    /* color: #bf04c2 */
    /* shown: false */
    ee.Feature(
        ee.Geometry.Point([-36.609986097082775, -9.783225466292642]),
        {
          "system:index": "0",
          "label": "Ponto fora da malha urbana",
          "classe": 1
        }),
    delimit = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.MultiPoint(),
    roi_est = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-47.628573981506214, -21.63246543645306],
          [-47.628573981506214, -21.632692326119003],
          [-47.62834867594896, -21.632692326119003],
          [-47.62834867594896, -21.63246543645306]]], null, false),
    point1 = /* color: #d63000 */ee.Geometry.Point([-36.66027650863087, -9.769019721188107]),
    point2 = /* color: #98ff00 */ee.Geometry.Point([-36.648946857751966, -9.750410253636014]);
var roi = roi;
var region = ee.FeatureCollection('projects/joaoaccioly/assets/extensao_bairros_arapiraca')
  //.filter(ee.Filter.eq('NM_MUN', 'Arapiraca'));
Map.centerObject(region, 10);
var Bairros = 
  ee.FeatureCollection(
    'projects/joaoaccioly/assets/bairros_arapiraca'
    );
var empty = ee.Image().byte(); //GeometryContour
var listBairros = empty.paint({
  featureCollection: Bairros,
  color: 1,
  width: 2
});
var palette_veg = [
  'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
  '74A901', '66A000', '529400', '3E8601', '207401', '056201',
  '004C00', '023B01', '012E01', '011D01', '011301'
  ];
var palette_temp = [
  '#000080', '#0000D9', '#4000FF', '#8000FF', '#0080FF', '#00FFFF', '#00FF80',
  '#80FF00', '#DAFF00', '#FFFF00', '#FFF500', '#FFDA00', '#FFB000', '#FFA400',
  '#FF4F00', '#FF2500', '#FF0A00'
  ];
var palette_albedo = [
  'ffffd4', 'fee391', 'fec44f', 'fe9929', 'd95f0e', '993404'
  ];
function radiance(image) {
  var b1 = image.select("SR_B1").multiply(0.0000275).add(-0.2);
  var b2 = image.select("SR_B2").multiply(0.0000275).add(-0.2);
  var b3 = image.select("SR_B3").multiply(0.0000275).add(-0.2);
  var b4 = image.select("SR_B4").multiply(0.0000275).add(-0.2);
  var b5 = image.select("SR_B5").multiply(0.0000275).add(-0.2);
  var b6 = image.select("SR_B6").multiply(0.00341802).add(149.0);
  var b7 = image.select("SR_B7").multiply(0.0000275).add(-0.2);
  var b10 = image.select("ST_B10").multiply(0.0000275).add(-0.2);
  var transmitance = image.select("ST_ATRAN").multiply(0.0001);
  var emissividade = image.select("ST_EMIS").multiply(0.0001);
  var down_radiance = image.select("ST_DRAD").multiply(0.001);
  var up_radiance = image.select("ST_URAD").multiply(0.001);
  var thermalrad = image.select("ST_TRAD").multiply(0.001)
    return image
    .addBands(b1, null, true)
    .addBands(b2, null, true)
    .addBands(b3, null, true)
    .addBands(b4, null, true)
    .addBands(b5, null, true)
    .addBands(b6, null, true)
    .addBands(b7, null, true)
    .addBands(b10, null, true)
    .addBands(transmitance, null, true)
    .addBands(emissividade, null, true)
    .addBands(down_radiance, null, true)
    .addBands(up_radiance, null, true)
    .addBands(thermalrad, null, true)
    .set({ date: image.date().format('YYYY-MM-dd') });
}
var ESUN = ee.Dictionary({ // Ruhoff(2015)
  'SR_B2': 1982,
  'SR_B3': 1827,
  'SR_B4': 1540,
  'SR_B5': 942,
  'SR_B6': 234,
  'SR_B7': 79
});
function p_lamb(image) {
  var L_lamb = image.select(["SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B6", "SR_B7"]); // Select all bands starting with 'radiance'
  var esun = ee.Number(ESUN.get('SR_B2'))
    .add(ESUN.get('SR_B3'))
    .add(ESUN.get('SR_B4'))
    .add(ESUN.get('SR_B5'))
    .add(ESUN.get('SR_B6'))
    .add(ESUN.get('SR_B7'));
  var elevacao = image.get('SUN_ELEVATION');
  var con = ee.Number(90).subtract(elevacao);
  var costheta = con.cos();
  var dr = image.get('EARTH_SUN_DISTANCE');
  var plamb = (L_lamb.multiply(Math.PI)).divide(esun.multiply(costheta).multiply(dr));
  return image.addBands(plamb)
    .clip(region)
    .copyProperties(image, image.propertyNames())
    .set({ data: image.date().format('YYYY-MM-dd') });
}

var srtm = ee.Image("USGS/SRTMGL1_003")
  .clip(region);
var tw = srtm.multiply(0.00002);
var cons = ee.Image.constant(0.75);
var tsw_z = cons.add(tw);
//////////////////////////////////////////////////////////
// Função para calcular o albedo
function calculate_albedo(image) {
  var tsw = tsw_z;
  var tsw2 = tsw.multiply(tsw);
  var albedo = image.expression(
    '((0.300*B1) + (0.276*B2) + (0.233*B3) + (0.143*B4) + (0.035*B5) + (0.012*B7))', {
      "B1": image.select('SR_B1'),
      "B2": image.select('SR_B2'),
      "B3": image.select('SR_B3'),
      "B4": image.select('SR_B4'),
      "B5": image.select('SR_B5'),
      "B7": image.select('SR_B7')
    });
  var surf_albedo = albedo.expression('(albedo - 0.025) / tsw2',{
    'albedo':albedo,
    'tsw2':tsw2
  }).rename('ALBEDO');
  return image.addBands(surf_albedo)
    .clip(region)
    .copyProperties(image, image.propertyNames())
    .set({ data: image.date().format('YYYY-MM-dd') });
}
function cloudmask(image) {
  var cloudShadowBitMask = 1 << 3;
  var cloudsBitMask = 1 << 5;
  var saturationMask = image.select("QA_RADSAT").eq(0);
  var qa = image.select('QA_PIXEL');

  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
    .and(qa.bitwiseAnd(cloudsBitMask).eq(0));

  return image.updateMask(mask)
    .updateMask(saturationMask)
    .copyProperties(image, ["system:time_start"]);
}

var collection = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
  .filterBounds(roi)
  .filter(ee.Filter.lt('CLOUD_COVER', 5))
  .filterDate('2024-01-06', '2024-01-08')
  .sort('CLOUDY_PIXEL_PERCENTAGE')
  .map(radiance)
  //.map(p_lamb)
  //.map(calculate_albedo)
  .map(cloudmask);
print(collection);
print('Number of images in the collection', collection.size());

var image_filter = collection.sort('CLOUD_COVER').first();
print(image_filter.get('system:index'));

var band_composition = collection.sort('CLOUD_COVER').first().clip(region);
Map.addLayer(band_composition, { bands: ['SR_B4', 'SR_B3', 'SR_B2'], min: 0.01, max: 0.10 }, 'Image RGB');

//////////////////////////////////////////////////
///////////////////////////////////////////////////
function calculateTs(image) {
  var temperature = image.expression(
    '1260.56 / log(((e_nb * 607.76) / thermalradiance) + 1)', {
      "e_nb": image.select('ST_EMIS'),
      "thermalradiance": image.select('ST_TRAD')
    }).subtract(281).rename('Temp');
    
  return image.addBands(temperature)
    .clip(region)
    .copyProperties(image, image.propertyNames())
    .set({ data: image.date().format('YYYY-MM-dd') });
}
var coll_temp = collection.map(calculateTs);
/*
var debug = coll_temp.sort('CLOUD_COVER').first().clip(region);
Map.addLayer(debug, { bands: ['Temp'],  palette: palette_temp, min: 295, max: 310 }, 'Temperatura');
*/
var reduce = coll_temp.median();
print('bandas', reduce.bandNames());
// A Variável collection de saída tem que ser a  que contém os componentes finais
var dias = coll_temp.aggregate_array('data');
print('Print the list of dates: ', dias);
var datas = dias.getInfo();
var serie_temporal = datas.map(loop);

function loop(data) {
  var collection_scale_filtered = coll_temp.filter(ee.Filter.eq('data', data));
  Map.addLayer(collection_scale_filtered, { bands: ['SR_B4', 'SR_B3', 'SR_B2'], min: 0.01, max: 0.10 }, 
  'Image RGB'.concat(data));
  Map.addLayer(collection_scale_filtered.select('Temp'),
    { palette: palette_temp, min: 29, max: 40 },
    'TS_'.concat(data));
  Export.image.toDrive({
    image: collection_scale_filtered.select('Temp'),
    folder: 'PESQUISA_GEE',
    description: 'Temperatura_Arapiraca'.concat(data),
    region: region,
    crs: 'EPSG:4674',
    scale: 10,
    maxPixels: 1e13
  });
}  


// ======================================================================================= // 
var amostras = ee.FeatureCollection([Ponto_urbano3,Ponto_fora_da_malha,Ponto_urbano2,Ponto_urbano1]);
print('What samples do we have?', amostras);
// ======================================================================================= // 
// ======================================================================================= // 
var chart = ui.Chart.image.seriesByRegion({
  imageCollection:coll_temp, 
  regions:amostras, 
  reducer:ee.Reducer.mean(), 
  band:'Temp', 
  scale:30, 
  xProperty:'system:time_start', 
  seriesProperty:'label'
})
  .setChartType('LineChart') // 'ScatterChart', 'LineChart', and 'ColumnChart'
    .setOptions({
          title: 'Temperatura das amostras - Arapiraca',
          vAxis: {title: 'Temperatura (°C)'},
          lineWidth: 1,
          pointSize: 5,
          series: {
          0:  {pointShape: 'circle',color: 'green'},
          1: { pointShape: 'triangle', rotation: 180, color: 'black'},
          2: {pointShape: 'square' , color: 'blue'},
          3: {pointShape: 'diamond', color: 'purple'}
}});

chart.style().set({
  position:'bottom-left',
  width:'300px',
  height:'200px'
});
Map.add(chart);

// Gere o transecto diretamente
var transect = ee.Geometry.LineString([
  point1, // Adicione as coordenadas reais do ponto inicial
  point2    // Adicione as coordenadas reais do ponto final
]);

// Gere pontos ao longo do transecto
var interval = 0.0004; // Graus
var tolerance = 0.001;
var totalLength = transect.length({ proj: 'EPSG:4326', maxError: tolerance });
var distances = ee.List.sequence(0, totalLength, interval);


// Divida o transecto em segmentos de comprimento igual
var parts = transect.cutLines({
  distances: distances,
  proj: 'EPSG:4326',
  maxError: tolerance
});
var reduce = coll_temp.first().select('Temp').rename('Temperatura');
// Resultado é uma geometria MultiLine
// Obtenha as geometrias individuais e crie um ponto
// a partir do ponto de início de cada segmento de linha
var points = ee.FeatureCollection(parts.geometries().map(function (part) {
  var startPoint = ee.Geometry(part).coordinates().get(0);
  var point = ee.Algorithms.GeometryConstructors.Point(startPoint);
  var coords = point.coordinates();
  return new ee.Feature(point, { 'lat': coords.get(1), 'lon': coords.get(0) });
}));
Map.addLayer(points, { color: 'red' }, 'Transecto Lat');
// Extraia os valores de pixel em cada ponto
var samples = reduce.sampleRegions({
  collection: points,
  properties: ['lat', 'lon'],
  scale: 30, // ou ajuste conforme necessário
});
// Trace o perfil
var chart = ui.Chart.feature.byFeature({
  features: samples,
  xProperty: 'lat',
  yProperties: ['Temperatura']
}).setChartType('LineChart')
  .setOptions({
    lineWidth: 4,
    pointSize: 0,
    fontSize:30,
    title: 'Temperature Profile',
    titleTextStyle: { fontSize: 30 },
    vAxis: { title: 'Temperature (°C)', gridlines: { color: 'transparent' } },
    hAxis: { title: 'Latitude', gridlines: { color: 'transparent' } },
    series: {
      0: { color: 'blue' },
    },
    legend: { position: 'none' },
    curveType: 'function',
    chartArea: { left: 100, right: 100 },
    backgroundColor: 'transparent'
  });

// Adicione o gráfico ao mapa
chart.style().set({
  position: 'bottom-left',
  width: '400px',
  height: '200px'
});
print(chart);
var srtm = ee.Image("USGS/SRTMGL1_003");
// Recorta o conjunto de dados SRTM para a região de Maceió
var clip = srtm.clip(region);
// Centralize a região de Maceió no mapa
//Map.addLayer(clip, {palette: ['white','green','yellow','orange','red','darkred'],min:160, max: 350},'SRTM');
Export.image.toDrive({
  image: clip,
  description: 'SRTM_Arapiraca',
  //folder: 'PESQUISA_GEE',
  fileNamePrefix: 'SRTM',
  scale: 30,
  maxPixels:1e13,
  fileFormat:'GeoTIFF'
});
var point = ee.Geometry.Point([-36.61916666,-9.80444444]);
Map.addLayer(point,{ color: 'red' }, 'Ponto da estação');
Map.addLayer(listBairros, { color: 'black' }, 'Bairros do inferno');
Map.addLayer(region, { color: 'black' }, 'Extensão do inferno');

var image_filter = coll_temp.sort('CLOUD_COVER').first();
var Classified = image_filter
    .where(image_filter.gt(34).and(image_filter.lte(36)), 0)
    .where(image_filter.lt(34).and(image_filter.gt(37)).mask(0), 1)
Map.addLayer(Classified.select('Temp'),{ palette: ['black','white'], min: 0, max: 1 },'Temperatura classificada');