import * as Highcharts from 'highcharts';
import 'highcharts/modules/treemap';
import 'highcharts/modules/heatmap';
import 'highcharts/modules/exporting';

import { createChartStylesheet } from './config/styles';
import { parseMetadata } from './data/metadataParser';
import { processSeriesData } from './data/dataProcessor';
import { applyHighchartsDefaults } from './config/highchartsSetup';
import { generateLevels, updateTitle, updateSubtitle } from './config/chartUtils';
import { scaleValue } from './formatting/scaleFormatter';
import { formatTooltip } from './formatting/tooltipformatter';

(function () {
    /**
     * Custom Web Component for rendering a Heatmap in SAP Analytics Cloud.
     * @extends HTMLElement
     */
    class Treemap extends HTMLElement {
        /**
         * Initializes the shadow DOM, styles, and chart container.
         */
        constructor() {
            super();
            this.attachShadow({ mode: 'open' });

            this.shadowRoot.adoptedStyleSheets = [createChartStylesheet()];

            this.shadowRoot.innerHTML = `
                <div id="container"></div>
            `;
        }

        /**
         * Called when the widget is resized.
         * @param {number} width - New width of the widget.
         * @param {number} height - New height of the widget.
         */
        onCustomWidgetResize(width, height) {
            this._renderChart();
        }

        /**
         * Called after widget properties are updated.
         * @param {Object} changedProperties - Object containing changed attributes.
         */
        onCustomWidgetAfterUpdate(changedProperties) {
            this._renderChart();
        }

        /**
         * Called when the widget is destroyed. Cleans up chart instance.
         */
        onCustomWidgetDestroy() {
            if (this._chart) {
                this._chart.destroy();
                this._chart = null;
            }
        }

        /**
         * Specifies which attributes should trigger re-rendering on change.
         * @returns {string[]} An array of observed attribute names.
         */
        static get observedAttributes() {
            return [
                'chartTitle', 'titleSize', 'titleFontStyle', 'titleAlignment', 'titleColor',                // Title properties
                'chartSubtitle', 'subtitleSize', 'subtitleFontStyle', 'subtitleAlignment', 'subtitleColor', // Subtitle properties
                'scaleFormat', 'decimalPlaces'                                                              // Number formatting properties
            ];
        }

        /**
        * Called when an observed attribute changes.
        * @param {string} name - The name of the changed attribute.
        * @param {string} oldValue - The old value of the attribute.
        * @param {string} newValue - The new value of the attribute.
        */
        attributeChangedCallback(name, oldValue, newValue) {
            if (oldValue !== newValue) {
                this[name] = newValue;
                this._renderChart();
            }
        }

        /**
         * Renders the chart using the provided data and metadata.
         */
        _renderChart() {
            const dataBinding = this.dataBinding;
            if (!dataBinding || dataBinding.state !== 'success' || !dataBinding.data || dataBinding.data.length === 0) {
                if (this._chart) {
                    this._chart.destroy();
                    this._chart = null;
                }
                return;
            }
            console.log('dataBinding:', dataBinding);
            const { data, metadata } = dataBinding;
            const { dimensions, measures } = parseMetadata(metadata);

            if (dimensions.length === 0 || measures.length === 0) {
                if (this._chart) {
                    this._chart.destroy();
                    this._chart = null;
                }
                return;
            }

            const [measure] = measures;
            const seriesData = processSeriesData(data, dimensions, measure);
            console.log('processSeriesData - seriesData: ', seriesData);

            const totalLevels = dimensions.length;
            console.log('Total levels: ', totalLevels);
            const levels = generateLevels(totalLevels);

            const scaleFormat = (value) => scaleValue(value, this.scaleFormat, this.decimalPlaces);

            const seriesName = measures[0]?.label || 'Measure';
            const dimDescriptions = dimensions.map(dim => {
                const dimDescription = dim.description || 'Dimension Description';
                return dimDescription;
            });
            const dimPart = dimDescriptions.join(', ');
            const autoTitle = `${seriesName} per ${dimPart}`;
            const titleText = updateTitle(autoTitle, this.chartTitle);

            const subtitleText = updateSubtitle(this.chartSubtitle, this.scaleFormat);

            const series = [{
                layoutAlgorithm: 'squarified',
                name: seriesName,
                allowTraversingTree: true,
                animationLimit: 1000,
                borderColor: '#ffffff',
                cluster: {
                    enabled: true,
                    pixelWidth: 15,
                    pixelHeight: 30,
                    reductionFactor: 10
                },
                dataLabels: {
                    enabled: false, 
                    allowOverlap: true
                },
                data: seriesData,
                levels: levels,
            }]

            applyHighchartsDefaults();

            const chartOptions = {
                chart: {
                    type: 'treemap',
                    style: {
                        fontFamily: "'72', sans-serif"
                    }
                },
                credits: {
                    enabled: false
                },
                exporting: {
                    enabled: false
                },
                title: {
                    text: titleText,
                    align: this.titleAlignment || 'left',
                    style: {
                        fontSize: this.titleSize || '16px',
                        fontWeight: this.titleFontStyle || 'bold',
                        color: this.titleColor || '#004b8d',
                    }
                },
                subtitle: {
                    text: subtitleText,
                    align: this.subtitleAlignment || "left",
                    style: {
                        fontSize: this.subtitleSize || "11px",
                        fontStyle: this.subtitleFontStyle || "normal",
                        color: this.subtitleColor || "#000000",
                    },
                },
                tooltip: {
                    useHTML: true,
                    followPointer: true,
                    hideDelay: 0,
                    formatter: formatTooltip(scaleFormat, dimensions)
                },
                series
            };
            this._chart = Highcharts.chart(this.shadowRoot.getElementById('container'), chartOptions);
        }
    }
    customElements.define('com-sap-sample-treemap', Treemap);
})();