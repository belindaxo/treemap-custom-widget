import * as Highcharts from 'highcharts';

/**
 * Formats the tooltip content for the chart.
 * @param {Function} scaleFormat - A function to scale and format the value.
 * @param {Array} dimensions - An array of dimension objects.
 * @returns {Function} A function that formats the tooltip content.
 */
export function formatTooltip(scaleFormat, dimensions) {
    return function () {
        const seriesName = this.series.name;
        const name = this.name;
        const description = this.point.description;
        let rawVal = 0;

        if (this.node.isLeaf) {
            rawVal = this.value;
        } else {
            rawVal = this.node.childrenTotal;
        }
        
        const { scaledValue, valueSuffix } = scaleFormat(rawVal);
        const value = Highcharts.numberFormat(scaledValue, -1, '.', ',');
        let valueWithSuffix;
        if (valueSuffix === '%') {
            valueWithSuffix = `${value}${valueSuffix}`;
        } else {
            valueWithSuffix = `${value} ${valueSuffix}`;
        }

        return `
            <div style="text-align: left; font-family: '72', sans-serif; font-size: 14px;">
                <div style="font-size: 14px; font-weight: normal; color: #666666;">${seriesName}</div>
                <div style="font-size: 18px; font-weight: normal; color: #000000;">${valueWithSuffix}</div>
                <hr style="border: none; border-top: 1px solid #eeeeee; margin: 5px 0;">
                <table style="width: 100%; font-size: 14px; color: #000000;">
                    <tr>
                        <td style="text-align: left; padding-right: 10px;">${description}</td>
                        <td style="text-align: right; padding-left: 10px;">${name}</td>
                    </tr>
                </table>
            </div>
        `;
    };
}