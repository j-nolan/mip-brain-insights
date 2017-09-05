import React, { Component } from 'react'
import ReactHighcharts from 'react-highcharts'
import BrainBrowser from './libraries/BrainBrowser/index.js'
import './App.css'

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
  render() {
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
        <div className="cleared">
          <div className="float-left">
            <BrainBrowser
              volumes={[{
                type: 'nifti1',
                nii_url: "models/labels_Neuromorphometrics.nii",
              }]}
              onSliceUpdate={console.log}
            />
          </div>
          <div className="float-right">
            <ReactHighcharts config={hc_config} />
          </div>
        </div>
      </div>
    )
  }
}

export default App
