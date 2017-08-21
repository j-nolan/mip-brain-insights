
const { promisify } = require('util')
const parseAsync = promisify(require('csv-parse'))
const readFileAsync = promisify(require('fs').readFile)
const csvParseOptions = require('./csv-parse-options.json')
const LineChartGenerator = require('./chartGenerators/LineChartGenerator')
const RangeChartGenerator = require('./chartGenerators/RangeChartGenerator')
const { max, concat } = require('./utils.js')

/* Params */
// The number of units that must be added to the max value of a chart
// to avoid the graph touching its upper border
const TOP_CHART_MARGIN = 10;

/* Program starts */
// Check file was provided
const files = process.argv.slice(2)
if (!files.length === 0) {
  process.stdout.write('Usage: node index.js path_to_csv_file [, path_to_csv_file_2] \n')
  return
}

// Read files, parse them as CSV, merge all in a single array
Promise.all(files.map(file => readFileAsync(file, 'utf-8')))
.then(results => Promise.all(results.map(csv => parseAsync(csv, csvParseOptions))))
.then(results => concat(results))
.then(results => {
  if (results.length < 1) throw new Error('No results could be parsed')
  const { index, Label, ...columns } = results[0]

  // Generate output
  const output = []
  results.forEach(({ index, ...columns }) => {
    const visualizations = []
    const rangeChart = new RangeChartGenerator(columns)
    const lineChart = new LineChartGenerator(columns)
    if (rangeChart.supportsData()) {
      visualizations.push(rangeChart.generate())
    }
    if (lineChart.supportsData()) {
      visualizations.push(lineChart.generate())
    }
    output[index] = (output[index] || []).concat(visualizations)
  })

  // All visualization should have identical scale for easier visual comparison,
  // and this value should be the highest value among all records
  const maxValue = results.reduce((acc, { index, Label, ...columns }) => {
    maxColumn = max(Object.values(columns))
    return acc > maxColumn ? acc : maxColumn
  }, 0)

  output.forEach(region =>
    region.forEach(visualization => {
      visualization.data.yAxis.max = maxValue + TOP_CHART_MARGIN
    })
  )

  process.stdout.write(JSON.stringify(output, null, 2))
})
.catch(console.error)
