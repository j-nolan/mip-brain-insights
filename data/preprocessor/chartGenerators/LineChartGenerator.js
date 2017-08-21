const lineChartShape = require('./shapes/line-chart.json')
const { deepCopy } =  require('../utils')

// Generate a line chart
function LineChartGenerator({ Label, ...columns }) {
  this.label = Label
  this.columns = columns
}

LineChartGenerator.prototype.supportsData = function() {
  // Supported if all these conditions are met:
  // 1. row contains an label
  // 2. Columns is an object (columnName => columnValue)
  // 3. Columns keys all have the same prefix and are followed by a number. Example: t0, t1, t2,...)
  if (this.label === undefined) {
    return false
  }
  if (typeof this.columns !== 'object') {
    return false
  }
  const columns = Object.keys(this.columns)
  let previousPrefix
  for (var i = 0; i < columns.length; ++i) {
    const prefix = /^([^0-9]+)\d+$/.exec(columns[i])[1]
    if (previousPrefix != undefined && prefix !== previousPrefix) {
      return false
    }
    previousPrefix = prefix
  }
  return true
}

LineChartGenerator.prototype.generate = function() {
  if (!this.supportsData()) {
    throw new Error(
      'Invalid data to generate chart with ' +
        this.constructor.name +
        '. Require at least a label and one column',
    )
  }
  const visualization = deepCopy(lineChartShape)
  visualization.data.title.text = 'Line chart with for region ' + this.label
  visualization.data.xAxis.categories = Object.keys(this.columns)
  visualization.data.series = [
    {
      name: 'Data (TBD)',
      data: Object.values(this.columns),
    },
  ]
  return visualization
}

module.exports = LineChartGenerator
