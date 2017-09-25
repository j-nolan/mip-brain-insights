import parse from 'csv-parse'

// The Brain Insights Format is a CSV file that follows the following structure:

// Fragment description    | Left hippocampus | Right hippocampus | (Region 3)  | ...
// -----------------------------------------------------------------------------------
// Volume-age:series:10    | 9.2              |                   |             |
// Volume-age:range:10:min | 2                |                   |             |
// Volume-age:range:10:max | 15               |                   |             |
// Volume-age:series:20    | 12               |                   |             |
// Volume-age:range:20:min | 8                |                   |             |
// Volume-age:range:20:max | 16               |                   |             |
// Iron-age:series:10      | 9.2              |                   |             |
// Iron-age:range:10:min   | 2                |                   |             |
// Iron-age:range:10:max   | 15               |                   |             |
// Iron-age:series:20      | 12               |                   |             |
// Iron-age:range:20:min   | 8                |                   |             |
// Iron-age:range:20:max   | 16               |                   |             |

// Each line of this file is called a "fragment".
// A fragment lists yValues for each brain region. The type of the yValue is defined by the fragment
// description. The fragment description contains:
// - name: the name of the serie (eg. "Myelin-age")
// - type: the range of a serie (either "serie" if the fragment is describing values of a serie
//         or "arearange" if the fragment is describing a value in a range)
// - xValue: the xValue that the serie fragment describes (eg. 18)
// - rangeType: if the type of series is a range, describes if it's the min or the max value of
//              range. If the type is a serie, this field is undefined

const POSSIBLE_FRAGMENT_TYPES = ['line', 'arearange']
const POSSIBLE_RANGE_TYPES = ['min', 'max']

const CSV_PARSE_OPTIONS = {
  delimiter: ',',
  trim: true,
  columns: true,
  auto_parse: true,
}

class BrainInsightsFormatParser {
  constructor(csvString) {
    this.csvString = csvString
  }

  parseFragmentDescription(fragment) {
    const fragmentDescription = fragment.fragment_description
    const splittedFragmentDescription = fragmentDescription.split(':')
    if (splittedFragmentDescription.length < 3) {
      throw new Error(`serie fragment description must have at least three sections separated by ':'
        tokens but the series provided ${fragmentDescription} only has
        ${splittedFragmentDescription.length}`)
    }

    const serieName = splittedFragmentDescription[0]
    let serieType = splittedFragmentDescription[1]

    if (serieType === 'series') {
      serieType = 'line'
    }
    if (serieType === 'range') {
      serieType = 'arearange'
    }

    let xValue, rangeType

    if (POSSIBLE_FRAGMENT_TYPES.indexOf(serieType) === -1) {
      throw new Error(`Unknown fragment type ${serieType}. Must be one of
        ${POSSIBLE_FRAGMENT_TYPES.join(',')}`)
    }

    if (serieType === 'line') {
      xValue = parseFloat(splittedFragmentDescription[2])
    }

    if (serieType === 'arearange') {
      rangeType = splittedFragmentDescription[2]
      xValue = parseFloat(splittedFragmentDescription[3])
    }

    if (serieType === 'arearange' && POSSIBLE_RANGE_TYPES.indexOf(rangeType) === -1) {
      throw new Error(`Unknown range type ${rangeType} in ${fragmentDescription}.
        Must be one of ${POSSIBLE_RANGE_TYPES.join(',')}`)
    }

    return {
      ...fragment,
      fragment_description: { serieName, serieType, xValue, rangeType },
    }
  }

  parseCSV(csvString) {
    return new Promise((resolve, reject) => {
      parse(this.csvString, CSV_PARSE_OPTIONS, (err, result) => {
        if (err) {
          reject(err)
          return
        }
        resolve(result)
      })
    })
  }

  // Returns a promise that resolves to an object that has one property per brain region, each of
  // them being an array of highchart series
  toHighchartsSeries() {
    // Parse CSV, parse fragment descriptions and generate series
    return this.parseCSV(this.csvString)
      .then(fragments => fragments.map(this.parseFragmentDescription))
      .then(this.fragmentsToHighchartsSeries)
  }

  fragmentsToHighchartsSeries(fragments) {
    // We will build lists of series for each brain region
    const brainRegions = {}

    // Loop through all rows (aka "fragments") of the CSV file
    fragments.forEach(fragment => {
      // Each fragment has:
      // - a property "fragment_description" containing metadata
      // - one property per brain region. Each brain region has an yValue
      const { fragment_description: fragmentDescription, ...fragmentRegions } = fragment
      const { serieName, serieType, xValue, rangeType } = fragmentDescription

      // Loop through all regions described by the fragment
      Object.keys(fragmentRegions).forEach(regionName => {
        const yValue = fragmentRegions[regionName]
        let brainRegion = brainRegions[regionName]
        if (!brainRegion) {
          brainRegion = { series: [] }
          brainRegions[regionName] = brainRegion
        }

        // Look if a serie with the same name and type has already been created, in which case
        // we will push the datapoint to that serie.
        // If a matching serie could not be find, create a new one
        let serie = brainRegion.series.find(
          serie => serie.name === serieName && serie.type === serieType,
        )
        if (!serie) {
          serie = { name: serieName, type: serieType, data: [] }
          brainRegion.series.push(serie)
        }

        // - If we are building a highcharts "serie", we must provide datapoints as arrays of
        // two elements, with the first elements being the xValue and the second being the
        // yValue.
        // - If we are building a range, we must provide datapoints as arrays of three elements,
        // the first element being the xValue, the second being the "min" yValue, and the last
        // being the "max" yValue
        let dataPoint = serie.data.find(item => item[0] === xValue)
        if (!dataPoint) {
          dataPoint = [xValue]
          serie.data.push(dataPoint)
        }
        if (serieType === 'line') {
          dataPoint[1] = yValue
        } else if (serieType === 'arearange') {
          if (rangeType === 'min') {
            dataPoint[1] = yValue
          } else {
            dataPoint[2] = yValue
          }
        }
      })
    })
    Object.values(brainRegions).forEach(region =>
      region.series.forEach(serie => serie.data.sort((item1, item2) => item1[0] - item2[0])),
    )
    return brainRegions
  }
}

export default BrainInsightsFormatParser
