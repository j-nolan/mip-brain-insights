const rangeChartShape = require('./shapes/range-chart.json')
const { deepCopy } = require('../utils.js')

function RangeChartGenerator({ Label, ...columns }) {
  this.label = Label
  this.columns = columns
}

RangeChartGenerator.prototype.getAvgMinMaxTriplets = function() {
  if (typeof this.columns !== 'object') {
    return undefined
  }

  return {
    avgs: Object.keys(this.columns).filter(key => key.startsWith('avg_')).map(k => this.columns[k]),
    mins: Object.keys(this.columns).filter(key => key.startsWith('min_')).map(k => this.columns[k]),
    maxs: Object.keys(this.columns).filter(key => key.startsWith('max_')).map(k => this.columns[k]),
  }
}

RangeChartGenerator.prototype.supportsData = function() {
  // Supported if we have a label, and at least one (avg, min, max) triplet
  const avgMinMaxTriplets = this.getAvgMinMaxTriplets()
  if (avgMinMaxTriplets === undefined) {
    return false
  }

  const { avgs, mins, maxs } = avgMinMaxTriplets
  
  if(avgs.length == 0 || mins.length == 0 || maxs.length == 0) {
    return false
  }

  if (avgs.length !== mins.length || mins.length !== maxs.length) {
    return false
  }
  return true
}

// Generate a range graph
// Expects columns to be (avg_t0, avg_t1,..., max_t0, max_t2,... min_t0, min_t1,...)
RangeChartGenerator.prototype.generate = function() {
  if (!this.supportsData()) {
    throw new Error(
      'Invalid data to generate chart with ' +
        this.constructor.name +
        '. Require at least an a label and a (avg_t0, min_t0, max_t0) triplet',
    )
  }
  
  const { avgs, mins, maxs } = this.getAvgMinMaxTriplets()

  if (avgs.length !== mins.length || mins.length !== maxs.length) {
    throw new Error('Expected to have the same number of averages range mins and range maxes')
  }

  const visualization = deepCopy(rangeChartShape)
  visualization.data.title.text = 'Line chart with min/max for region ' + this.label
  visualization.data.series[0].data = avgs.map((avg, i) => [i, avg])
  visualization.data.series[1].data = avgs.map((_, i) => [i, mins[i], maxs[i]])

  return visualization
}

module.exports = RangeChartGenerator
