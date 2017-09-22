import React, { Component } from 'react'
import './src/volume-viewer.js'
import './src/volume-viewer/modules/loading.js'
import './src/volume-viewer/modules/rendering.js'
import './src/volume-viewer/volume-loaders/nifti1.js'

export default class extends Component {
  componentDidMount() {
    window.BrainBrowser.VolumeViewer.start('volume-ui-template', viewer => {

      // Load the default color map.
      // (Second argument is the cursor color to use).
      viewer.loadDefaultColorMapFromURL('color-maps/spectral-brain-view.txt', '#FF0000')

      // Set the size of slice display panels.
      viewer.setPanelSize(256, 256)

      // Start rendering.
      viewer.render()

      // Load volumes.
      viewer.loadVolumes({
        volumes: this.props.volumes.map(volume => ({
          ...volume,
          template: {
            element_id: "volume-ui-template",
            viewer_insert_class: "volume-viewer-display"
          }
        }))
      })

      // Add slice update listener if a callback was provided
      if (this.props.onSliceUpdate) {
        viewer.addEventListener('sliceupdate', this.props.onSliceUpdate)
      }

      // Keep a reference for later access
      this.viewer = viewer
    })
  }
  render() {
    return (
      // Structure required by Brain Browser
      <div id="volume-ui-template">
        <div className="volume-viewer-display" />
      </div>
    )
  }
}
