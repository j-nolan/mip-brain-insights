;(function() {
  'use strict'

  // Removes all children from a dom node
  function clearChildren(domNode) {
    while (domNode.firstChild) {
      domNode.removeChild(domNode.firstChild)
    }
  }

  function ajax(url, callback) {
    var xmlhttp = new XMLHttpRequest()
    xmlhttp.onreadystatechange = function(e) {
      if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
        callback(xmlhttp.responseText)
      }
    }
    xmlhttp.open('GET', url, true)
    xmlhttp.send()
  }

  // Renders visualization in the provided container node
  // The node will be cleared and replaced with DIV elements, each containing
  // a single visualization
  var visualizationsCurrentlyDisplayed = []
  function updateVisualizations(destContainerNode, visualizations) {
    const areDifferentVisualizations = visualizations.reduce(
      (acc, visualization, i) => acc || visualizationsCurrentlyDisplayed[i] !== visualization,
      false
    )
    if (!areDifferentVisualizations) {
      return
    }
    
    clearChildren(destContainerNode)

    for (var i = 0; i < visualizations.length; ++i) {
      var destNode = document.createElement('div')
      destContainerNode.append(destNode)
      renderVisualization(destNode, visualizations[i])
    }
    visualizationsCurrentlyDisplayed = visualizations
  }

  // Renders a single visualization. The right visualization renderer is selected
  // according to the type of the visualization
  function renderVisualization(destNode, visualization) {
    switch (visualization.type) {
      case 'highcharts':
        Highcharts.chart(destNode, visualization.data)
        break
      default:
        throw new Error(
          "Expected type of visualization to be 'highcharts'. \
        Instead got " + visualization.type)
    }
  }

  document.addEventListener('DOMContentLoaded', function() {

    var destNode = document.getElementById('visualizations')
    if (!destNode) {
      throw new Error('No DOM element found with ID visualizations')
    }

    // Load visualization per brain region
    var visualizationsPerRegion
    ajax('data/visualizations-per-region.json', function(response) {
      visualizationsPerRegion = JSON.parse(response)
    })

    // Listen everytime the user moves position
    viewer.addEventListener('sliceupdate', function(e) {
      if (e.volume !== viewer.volumes[0]) {
        console.info('Skipping sliceupdate that hasn\'t been performed on first volume (atlas]')
        return
      }
      if (!visualizationsPerRegion) {
        // visualizations data might be loading, there might have been an error, but they
        // are not there so we do not do anything yet
        return
      }
      // When displaying atlases, we assign the same "intensity value"
      // to each region, so that they are voxels from the same region have
      // the same color. This allows the user to visually see the separation between
      // different regions of the brain
      // By convention, we use that value as the region id
      var regionId = Math.floor(e.volume.getIntensityValue())

      var visualizations = visualizationsPerRegion[regionId]
      if (!visualizations) {
        console.info('No visualization data found for region identified by id', regionId)
        visualizations = []
      }

      updateVisualizations(destNode, visualizations)
    })
  })
})()
