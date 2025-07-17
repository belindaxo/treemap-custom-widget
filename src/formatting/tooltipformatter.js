import * as Highcharts from 'highcharts';

/**
 * Formats the tooltip content for the chart.
 * @param {Function} scaleFormat - A function to scale and format the value.
 * @param {Array} dimensions - An array of dimension objects.
 * @returns {Function} A function that formats the tooltip content.
 */
export function formatTooltip(scaleFormat, dimensions) {
    return function () {
        console.log(this);
        const seriesName = this.series.name;
    };
}