import React, { Component } from 'react'
import ReactHighcharts from 'react-highcharts'
import HighchartsMore from 'highcharts-more'
import BrainBrowser from './libraries/BrainBrowser/index.js'
import BrainInsightsFormatParser from './BrainInsightsFormatParser'
import BrainRegionById from './BrainRegionById'
import './App.css'

HighchartsMore(ReactHighcharts.Highcharts)

// The endpoint that will be queried to access the available files
const AVAILABLE_FILES_ENDPOINT = 'data/available-files.json'

class App extends Component {
  state = {
    files: [],
    filesRequestStatus: 'LOADING', // LOADING => SUCCESS/ERROR
    filesRequestError: undefined, // specifies the error in case filesRequestStatus is ERROR
  }

  // Fetches the list of available files from the server. The list returned only contains metadata
  // for each file, such as their names, types and URL. It does not fetch the content of the file.
  // This must be done using the fetchFileContent method for each file
  fetchAvailableFiles() {
    return fetch(AVAILABLE_FILES_ENDPOINT).then(response => response.json())
  }

  // Fetches the content of a given file by querying the "url" property of the file object
  fetchFileContent(file) {
    return fetch(file.url)
      .then(response => response.text())
      .then(rawContent => ({ ...file, rawContent }))
  }

  // Mark a file as used by the user. This means he wants the file to be taken into account when
  // displaying charts.
  useFile = file =>
    this.setState({
      files: this.state.files.map(item => (item === file ? { ...item, used: true } : item)),
    })

  // Marks a file as unused (opposite of useFile above)
  unuseFile = file =>
    this.setState({
      files: this.state.files.map(item => (item === file ? { ...item, used: false } : item)),
    })

  // The function that will be called when the user clicks a checkbox associated with a file.
  // the function checks if the file is currently marked as used. If it is, it marks it as unused.
  // If it isn't, it marks it as used.
  handleFileCheckboxChange = file => {
    if (file.used) {
      this.unuseFile(file)
    } else {
      this.useFile(file)
    }
  }

  // The constructor fetch the list of available files, and for each file, retrieve its content and
  // parse it.
  // Mark each file as "used" (because by default, we assume the user uses all the available files)
  constructor() {
    super()
    let files
    this.fetchAvailableFiles()
      .then(availableFiles => availableFiles.map(file => ({ ...file, used: true })))
      .then(availableFiles => {
        files = availableFiles
        return Promise.all(availableFiles.map(this.fetchFileContent))
      })
      .then(filesWithContent => Promise.all(filesWithContent.map(file =>
        new BrainInsightsFormatParser(file.rawContent).toHighchartsSeries()
      )))
      .then(dataPerFile =>
        this.setState({
          filesRequestStatus: 'SUCCESS',
          files: files.map((file, i) => ({ ...file, data: dataPerFile[i] })),
        }),
      )
      .catch(e =>
        this.setState({
          filesRequestStatus: 'ERROR',
          filesRequestError: e,
        }),
      )
  }

  handleSliceUpdate = (e) => {
    const brainRegionId = e.volume.getIntensityValue()
    if (this.state.currentSelectedRegionId !== brainRegionId) {
      this.setState({ currentSelectedRegionId: brainRegionId })
    }
  }

  render() {
    if (this.state.filesRequestStatus === 'LOADING') {
      return <p>Loading...</p>
    }
    if (this.state.filesRequestStatus === 'ERROR') {
      return (
        <p>
          An error has occurred while loading the available files:
          {this.state.filesRequestError.message}
        </p>
      )
    }

    const selectedRegionName = BrainRegionById[this.state.currentSelectedRegionId]

    const series = this.state.files
      .filter(file => file.used)
      .map(file => file.data[selectedRegionName] ? file.data[selectedRegionName].series : [])

    let concatenatedSeries = [].concat.apply([], series)

    const highchartsConfig = {
      series: concatenatedSeries,
      title: { text: selectedRegionName }
    }

    return (
      <div className="app">
        <h1>MIP Brain Insights</h1>
        <section className="emphasized-note">
          <h2>Usage</h2>
          <p>
            Browse through the regions in the atlas panel. The visualization will update depending
            on the region you are viewing.
          </p>
        </section>
        <form>
          {this.state.files.map(file => (
            <label key={file.name}>
              <input
                type="checkbox"
                checked={file.used}
                onChange={this.handleFileCheckboxChange.bind(this, file)}
              />
              {file.name}
            </label>
          ))}
        </form>
        <div className="cleared">
          <div className="col-1-4 float-left">
            <BrainBrowser
              volumes={[
                {
                  type: 'nifti1',
                  nii_url: 'models/labels_Neuromorphometrics.nii',
                },
              ]}
              onSliceUpdate={this.handleSliceUpdate}
            />
          </div>
          <div className="col-3-4 float-right">
            <ReactHighcharts config={highchartsConfig} />
          </div>
        </div>
      </div>
    )
  }
}

export default App
