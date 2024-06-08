
var roi = roi;
var region = ee.FeatureCollection('projects/joaoaccioly/assets/Brazil_Municipalities_2022')
                                  .filter(ee.Filter.eq('NM_MUN','Arapiraca'))
                                  
Map.centerObject(region,10)
// ======================================================================================= // 
// ======================================================================================= //
var palette_ndvi = ['FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
               '74A901', '66A000', '529400', '3E8601', '207401', '056201',
               '004C00', '023B01', '012E01', '011D01', '011301'];
var visParams = {
  min: 0,
  max: 1,
  palette: ['0000FF','FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
               '74A901', '66A000', '529400', '3E8601', '207401', '056201',
               '004C00', '023B01', '012E01', '011D01', '011301']
};
// ======================================================================================= // 
// ======================================================================================= // 
function radiance(image){
    /*var qaMask = image.select(['QA_PIXEL']).bitwiseAnd(parseInt('111111', 2)) //analyze
                                           .eq(0) //2 = Unused //eq = 0 condições claras
    var saturationMask = image.select("QA_RADSAT").eq(0)*/ 
    //Radiometric saturation QA
    // Apply the scaling factors to the appropriate bands
    var opticalBands = image.select("SR_B.").multiply(0.0000275).add(-0.2)
    var thermalBands = image.select("ST_B.*").multiply(0.00341802).add(149.0)
    
    // Replace the original tracks with the scaled ones and apply the masks.
    return image
        .addBands(opticalBands, null, true)
        .addBands(thermalBands, null, true)
        //.updateMask(qaMask)
        //.updateMask(saturationMask)
        .copyProperties(image, image.propertyNames()) //Copies the property from the collection
        .set({date: image.date().format('YYYY-MM-dd')}) 
}
// ======================================================================================= // 
// ======================================================================================= // 
function cloudmask(image) {
  var cloudShadowBitMask = 1 << 3;
  var cloudsBitMask = 1 << 5;
  var saturationMask = image.select("QA_RADSAT").eq(0)
  var qa = image.select('QA_PIXEL');

  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
      .and(qa.bitwiseAnd(cloudsBitMask).eq(0));

  return image.updateMask(mask)
      .updateMask(saturationMask)
      .select("SR_B[0-9]*")
      .copyProperties(image, ["system:time_start"]);
}
// ======================================================================================= // 
// ======================================================================================= //
function indices (image) {
  //Water Indexes
  var ndwi = image.normalizedDifference(['SR_B3', 'SR_B5']).rename ('NDWI'); //Mc Feeters 1996
  var mndwi = image.normalizedDifference(['SR_B3', 'SR_B6']).rename('MNDWI'); // Xu 2006
  //////////////////////////////////
  return image.addBands([ndwi,mndwi])
              .clip(region)
}
// ======================================================================================= // 
// ======================================================================================= //
var collection = ee.ImageCollection("LANDSAT/LC08/C02/T1_L2")
                        .filterBounds(roi)
                        .filter(ee.Filter.lt('CLOUD_COVER',15))
                        .filterDate('2023-05-01','2023-09-30')//'2024-01-06','2024-01-08'
                        .sort('CLOUDY_PIXEL_PERCENTAGE')
                        .map(radiance)
                        .map(cloudmask)
                        .map(indices)
print(collection)
print('Number of images in the collection', collection.size())
// ======================================================================================= // 
// ======================================================================================= // 
var image_filter = collection.sort('CLOUD_COVER').first()
print(image_filter.get('system:index'))
//Map.addLayer(image_filter,{bands:['SR_B4','SR_B3','SR_B2'],min:0.011062500000000003, max:0.266015},'Image Filter - no clouds')
// ======================================================================================= // 
// ======================================================================================= // 
var band_composition = collection.sort('CLOUD_COVER').first().clip(region)
Map.addLayer(band_composition,{bands:['SR_B4','SR_B3','SR_B2'],min:0.014252500000000001, max:0.19644},'Image RGB - Clip')
Map.addLayer(band_composition,{bands:['SR_B5','SR_B3','SR_B2'],min:0.014252500000000001, max:0.36542749999999996},'Image NGB')
Map.addLayer(band_composition,{bands:['SR_B4','SR_B5','SR_B4'],min:0.030395000000000005, max:0.35154},'Image RNG')
Map.addLayer(band_composition,{bands:['SR_B7','SR_B6','SR_B4'],min:0.030395000000000005, max:0.40335000000000004},'Image SWIR')
// ======================================================================================= // 
// ======================================================================================= // 
var ESUN = ee.Dictionary({//Ruhoff(2015)
  'SR_B2': 1982,
  'SR_B3': 1827,
  'SR_B4': 1540,
  'SR_B5': 942,
  'SR_B6': 234,
  'SR_B7': 79
});
function p_lamb(image) {
  var L_lam = image.select('radiance'); 
  var esun = ee.Number(ESUN.get('SR_B*')); 
  //var elevacao = image.aggregate_mean('SUN_ELEVATION');
  var elevacao = image.get('SUN_ELEVATION');
  var cos_z = ee.Number(elevacao).multiply(Math.PI).divide(180).sin();
  var dt_s = image.get('EARTH_SUN_DISTANCE');
  var dr = ee.Number(1).divide(ee.Number(dt_s).pow(2));
  var plamb = (L_lam.multiply(Math.PI)).divide(esun.multiply(cos_z).multiply(dr));
  
  return image.addBands(plamb)
  .clip(region) 
  .copyProperties(image, image.propertyNames())
  .set({data: image.date().format('YYYY-MM-dd')})
}
function scale_and_ndvi(image) {
  var ndvi = image.normalizedDifference(['SR_B5','SR_B4']).rename('NDVI')

  return image.addBands(ndvi)
              .clip(region) 
              .copyProperties(image, image.propertyNames())
              .set({data: image.date().format('YYYY-MM-dd')});
}
// ======================================================================================= // 
// ======================================================================================= // 
var collection_scale= collection.map(scale_and_ndvi)
print('What bands we have? ', collection_scale.first().bandNames())
//Lista de datas
var dias = collection_scale.aggregate_array('data')
print('Print the list of dates: ',dias) 
var datas = dias.getInfo() 
var serie_temporal = datas.map(loop);
// ======================================================================================= // 
// ======================================================================================= // 
function loop(data){
  var collection_scale= collection.map(scale_and_ndvi).filter(ee.Filter.eq('data',data))
    Map.addLayer(collection_scale.select('NDVI'), 
              {palette: palette_ndvi, min:0, max:1}, 
                                'NDVI '.concat(data))
    Export.image.toDrive({
          image: collection_scale.select('NDVI').first(),
          folder: 'PESQUISA_GEE',
          description: 'NDVI_'.concat(data),
          region: region,
          crs:'EPSG:4674',
          scale: 30,
          maxPixels: 1e13
          })//Fim do Loop
}
// ======================================================================================= // 
// ======================================================================================= // 
var extracting_water = image_filter.select('NDWI').gte(0.1).selfMask()
Map.addLayer(extracting_water,{palette:['0000FF'],min:0, max:1}, 'Water')
// ======================================================================================= // 
// ======================================================================================= // 
var amostras = ee.FeatureCollection([Agricultura,Cerrado_PDG,Agua,Area_Urbana])
print('What samples do we have?', amostras)
// ======================================================================================= // 
// ======================================================================================= // 
var chart = ui.Chart.image.seriesByRegion({
  imageCollection:collection_scale, 
  regions:amostras, 
  reducer:ee.Reducer.mean(), 
  band:'NDVI', 
  scale:30, 
  xProperty:'system:time_start', 
  seriesProperty:'label'
})
  .setChartType('LineChart') // 'ScatterChart', 'LineChart', and 'ColumnChart'
    .setOptions({
          title: 'NDVI das amostras ao longo dos anos',
          vAxis: {title: 'NDVI'},
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
})
Map.add(chart)
// ======================================================================================= // 
// ======================================================================================= // 
// Função para gerar uma animação do NDVI para cada data
function generateNDVIAnimation(date) {
  var image = collection_scale
    .filterDate(ee.Date(date), ee.Date(date).advance(1, 'day'))
    .first();
  var ndvi = image.select('NDVI');
  var visualization = ndvi.visualize({
    min: 0,
    max: 1,
    palette: palette_ndvi,
  });
  return visualization.set('date', ee.Date(date).format('YYYY-MM-dd'));
}
// Mapear a função de animação na lista de datas
var animations = datas.map(generateNDVIAnimation);
// Criar a animação usando a função "animate" (pode demorar um pouco para criar)
var ndviAnimation = ee.ImageCollection.fromImages(animations);
// Get the region as an ee.Geometry object
//var regionGeometry = ee.Geometry.Rectangle(region);
var caixa = delimit
// Export the animation as a GIF
Export.video.toDrive({
  collection: ndviAnimation,
  description: 'NDVI_Animation',
  dimensions: 600,
  framesPerSecond: 3,
  region: caixa,
});
// Display the animation in the user interface (ui) as a thumbnail
var animationThumbnail = ui.Thumbnail({
  image: ndviAnimation,
  params: {
    dimensions: 600,
    region: caixa,
    framesPerSecond: 3,
    //maxFrames: 200,
    format: 'gif'
  },
  style: { position: 'bottom-center' }
});
//Map.add(animationThumbnail);
// Print the animation URL to the console
print(ndviAnimation.getVideoThumbURL({
  dimensions: 600,
  framesPerSecond: 3,
  region: caixa,
  //maxFrames: 200,
}));
print(ui.Thumbnail(ndviAnimation));

var chart = ui.Chart.image.series({
  imageCollection: collection_scale.select('NDVI'),
  region: roi_est,
  reducer: ee.Reducer.median(),
  scale: 10
}).setOptions({
  lineWidth: 1,
  title: 'Série Temporal - NDVI(PDG)',
  interpolateNulls: true,
  vAxis: {title: 'NDVI - PDG'},
  hAxis: {title: '', format: 'YYYY-MMM'},
  series: {0: {color: '#D3362D'}}, // Set the series color
  chartArea: {left: 60, right: 30, top: 20, bottom: 50}, // Adjust chart area
  legend: {position: 'none'}, // Remove legend
  intervals: {style: 'boxes', lineWidth: 1, barWidth: 2, boxWidth: 4}, // Box plot style
  interval: {min: {style: 'bars', fillOpacity: 1, color: '#777777'}, max: {style: 'bars', fillOpacity: 1, color: '#777777'}}, // Interval style
   // Remove line connecting the boxes
});

print(chart);