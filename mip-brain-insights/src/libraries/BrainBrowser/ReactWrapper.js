import React, { Component } from 'react'
import './src/volume-viewer.js'
import './src/volume-viewer/modules/loading.js'
import './src/volume-viewer/modules/rendering.js'
import './src/volume-viewer/volume-loaders/nifti1.js'

export default class extends Component {
  loadVolumes() {
    window.BrainBrowser.VolumeViewer.start('volume-ui-template', function(viewer) {
      // Add an event listener.
      viewer.addEventListener('volumesloaded', function() {
        console.log('Viewer is ready!')
      })

      // Load the default color map.
      // (Second argument is the cursor color to use).
      viewer.loadDefaultColorMapFromURL('color-maps/spectral-brain-view.txt', '#FF0000')

      // Set the size of slice display panels.
      viewer.setPanelSize(256, 256)

      // Start rendering.
      viewer.render()

      // Load volumes.
      viewer.loadVolumes({
        volumes: [
          {
            type: 'nifti1',
            nii_url: "models/labels_Neuromorphometrics.nii",
            template: {
              element_id: "volume-ui-template",
              viewer_insert_class: "volume-viewer-display"
            }
          }
        ]
      })
    })
  }
  render() {
    return (
      // Structure required by Brain Browser
      <div ref={() => this.loadVolumes()} id="volume-ui-template">
        <div className="volume-viewer-display" />
      </div>
    )
  }
}
