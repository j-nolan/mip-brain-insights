import React, { Component } from 'react'
import ReactHighcharts from 'react-highcharts'
import BrainBrowser from './libraries/BrainBrowser/index.js'
import './App.css'

// The endpoint that will be queried to access the available files
const AVAILABLE_FILES_ENDPOINT = 'data/available-files.json'

const hc_config = {
  title: {
    text: 'Solar Employment Growth by Sector, 2010-2016',
  },
  subtitle: {
    text: 'Source: thesolarfoundation.com',
  },
  yAxis: {
    title: {
      text: 'Number of Employees',
    },
  },
  legend: {
    layout: 'vertical',
    align: 'right',
    verticalAlign: 'middle',
  },
  plotOptions: {
    series: {
      pointStart: 2010,
    },
  },
  series: [
    {
      name: 'Installation',
      data: [43934, 52503, 57177, 69658, 97031, 119931, 137133, 154175],
    },
    {
      name: 'Manufacturing',
      data: [24916, 24064, 29742, 29851, 32490, 30282, 38121, 40434],
    },
    {
      name: 'Sales & Distribution',
      data: [11744, 17722, 16005, 19771, 20185, 24377, 32147, 39387],
    },
    {
      name: 'Project Development',
      data: [null, null, 7988, 12169, 15112, 22452, 34400, 34227],
    },
    {
      name: 'Other',
      data: [12908, 5948, 8105, 11248, 8989, 11816, 18274, 18111],
    },
  ],
}

class App extends Component {
  state = {
    files: [],
    filesRequestStatus: 'LOADING', // LOADING => SUCCESS/ERROR
    filesRequestError: undefined // specifies the error in case filesRequestStatus is ERROR
  }

  // Fetches the list of available files from the server. The list returned only contains metadata
  // for each file, such as their names, types and URL. It does not fetch the content of the file.
  // This must be done using the fetchFileContent method for each file
  fetchAvailableFiles() {
    return fetch(AVAILABLE_FILES_ENDPOINT)
    .then(response => response.json())
  }

  // Fetches the content of a given file by retrieving the "url" property of the file object
  fetchFileContent(file) {
    return fetch(file.url)
    .then(response => response.text())
    .then(content => ({...file, content }))
  }

  // Mark a file as used by the user. This means he wants the file to be taken into account when
  // displaying charts.
  useFile = file =>
    this.setState({
      files: this.state.files.map(
        item => item === file ? { ...item, used: true } : item
      )
    })

  // Marks a file as unused (opposite of useFile above)
  unuseFile = file =>
    this.setState({
      files: this.state.files.map(
        item => item === file ? { ...item, used: false } : item
      )
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


  // The constructor fetch the list of available files, and for each file, retrieve its content
  // Mark each file as "used" (because by default, we assume the user uses all the available
  // files)
  constructor() {
    super()
    this.fetchAvailableFiles()
    .then(availableFiles => availableFiles.map(file => ({ ...file, used: false })))
    .then(availableFiles => Promise.all(availableFiles.map(this.fetchFileContent)))
    .then(filesWithContent => this.setState({
      filesRequestStatus: 'SUCCESS',
      files: filesWithContent,
    }))
    .catch(e => this.setState({
      filesRequestStatus: 'ERROR',
      filesRequestError: e,
    }))
  }

  render() {
    if (this.state.filesRequestStatus === 'LOADING') {
      return <p>Loading...</p>
    }
    if (this.state.filesRequestStatus === 'ERROR') {
      return <p>An error has occurred while loading the available files:
        {this.state.filesRequestError.message}</p>
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
              volumes={[{
                type: 'nifti1',
                nii_url: "models/labels_Neuromorphometrics.nii",
              }]}
              onSliceUpdate={console.log}
            />
          </div>
          <div className="col-3-4 float-right">
            <ReactHighcharts config={hc_config} />
          </div>
        </div>
      </div>
    )
  }
}

export default App
