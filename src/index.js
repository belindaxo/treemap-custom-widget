import * as Highcharts from 'highcharts';
import 'highcharts/modules/treemap';
import 'highcharts/modules/heatmap';
import 'highcharts/modules/exporting';

import { createChartStylesheet } from './config/styles';
import { parseMetadata } from './data/metadataParser';
import { processSeriesData } from './data/dataProcessor';
import { applyHighchartsDefaults, overrideContextButtonSymbol } from './config/highchartsSetup';
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

            this._lastSentCategories = [];
            this._selectedPoint = null;
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
            this._selectedPoint = null;
        }

        /**
         * Specifies which attributes should trigger re-rendering on change.
         * @returns {string[]} An array of observed attribute names.
         */
        static get observedAttributes() {
            return [
                'chartTitle', 'titleSize', 'titleFontStyle', 'titleAlignment', 'titleColor',                // Title properties
                'chartSubtitle', 'subtitleSize', 'subtitleFontStyle', 'subtitleAlignment', 'subtitleColor', // Subtitle properties
                'scaleFormat', 'decimalPlaces',                                                             // Number formatting properties
                'enableCluster',                                                                            // Treemap properties
                'customColors'                                                                              // Color settings
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
                    this._selectedPoint = null;
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
                    this._selectedPoint = null;
                }
                return;
            }

            const [measure] = measures;
            const seriesData = processSeriesData(data, dimensions, measure);
            console.log('processSeriesData - seriesData: ', seriesData);
            console.log('Root nodes in seriesData:', seriesData.filter(node => !node.parent));

            const totalLevels = dimensions.length;
            console.log('Total levels: ', totalLevels);
            const levels = generateLevels(totalLevels);

            const validCategoryNames = seriesData.filter(node => !node.parent).map(node => node.name) || [];
            console.log('validCategoryNames: ', validCategoryNames);
            if (JSON.stringify(this._lastSentCategories) !== JSON.stringify(validCategoryNames)) {
                this._lastSentCategories = validCategoryNames;
                this.dispatchEvent(new CustomEvent('propertiesChanged', {
                    detail: {
                        properties: {
                            validCategoryNames
                        }
                    }
                }));
            }

            const defaultColors = ['#004b8d', '#939598', '#faa834', '#00aa7e', '#47a5dc', '#006ac7', '#ccced2', '#bf8028', '#00e4a7'];
            const customColors = this.customColors || [];

            seriesData.forEach(node => {
                if (!node.parent) {
                    const colorEntry = customColors.find(c => c.category === node.name);
                    if (colorEntry && colorEntry.color) {
                        node.color = colorEntry.color;
                    } else {
                        const index = validCategoryNames.indexOf(node.name);
                        node.color = defaultColors[index % defaultColors.length];
                    }
                }
            });

            console.log('seriesData with colors: ', seriesData);

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
                alternateStartingDirection: true,
                animationLimit: 1000,
                borderColor: '#ffffff',
                cluster: {
                    enabled: this.enableCluster,
                    pixelWidth: 15,
                    pixelHeight: 30,
                    reductionFactor: 10
                },
                dataLabels: {
                    enabled: true,
                    headers: false,
                    allowOverlap: true,
                    style: {
                        fontWeight: 'normal',
                    }
                },
                data: seriesData,
                levels: levels,
                breadcrumbs: {
                    events: {
                        click: function (button, breadcrumbs) {
                            const newLevel = breadcrumbs.level;
                            const rootLevel = (newLevel === 0) ? 1 : newLevel;
                            const rootId = breadcrumbs.levelOptions.id;
                            const linkedAnalysis = this.dataBindings.getDataBinding('dataBinding').getLinkedAnalysis();
                            if (!linkedAnalysis) return;

                            if (rootLevel === 1) {
                                linkedAnalysis.removeFilters();
                                return;
                            }

                            linkedAnalysis.removeFilters();

                            const labels = rootId.split('|');
                            console.log('Breadcrumbs - Labels:', labels);
                            const selection = {};
                            labels.forEach((label, index) => {
                                const dim = dimensions[index];
                                const matchingRow = data.find((item) => item[dim.key]?.label === label);
                                if (dim && matchingRow) {
                                    selection[dim.id] = matchingRow[dim.key].id;
                                }
                            });
                            console.log('Breadcrumbs - Selection:', selection);

                            linkedAnalysis.setFilters(selection);
                        }.bind(this)
                    }
                }
            }]

            applyHighchartsDefaults();
            overrideContextButtonSymbol();

            const chartOptions = {
                chart: {
                    type: 'treemap',
                    style: {
                        fontFamily: "'72', sans-serif"
                    },
                    animation: true
                },
                credits: {
                    enabled: false
                },
                exporting: {
                    enabled: true,
                    buttons: {
                        contextButton: {
                            enabled: false,
                        }
                    },
                    menuItemDefinitions: {
                        resetFilters: {
                            text: 'Reset Filters',
                            onclick: () => {
                                const linkedAnalysis = this.dataBindings.getDataBinding('dataBinding').getLinkedAnalysis();
                                if (linkedAnalysis) {
                                    linkedAnalysis.removeFilters();
                                }
                                if (this._selectedPoint) {
                                    this._selectedPoint.select(false, false);
                                    this._selectedPoint = null;
                                }
                                this._renderChart(); 
                            }
                        }
                    }
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
                    followPointer: false,
                    hideDelay: 0,
                    formatter: formatTooltip(scaleFormat, dimensions)
                },
                plotOptions: {
                    series: {
                        cursor: 'pointer',
                        allowPointSelect: true,
                        point: {
                            events: {
                                click: (event) => {
                                    const clickedPoint = event.point;
                                    const chart = clickedPoint.series.chart;
                                    const series = chart.series[0];
                                    const rootId = series.rootNode;

                                    console.log('point.events.click - clickedPoint:', clickedPoint);
                                    const linkedAnalysis = this.dataBindings.getDataBinding('dataBinding').getLinkedAnalysis();
                                    if (!linkedAnalysis) return;

                                    if (clickedPoint.node.isLeaf) {
                                        if (this._selectedPoint && this._selectedPoint !== clickedPoint) {
                                            this._selectedPoint.select(false, false);
                                        }
                                        clickedPoint.select(true, false);
                                        this._selectedPoint = clickedPoint;

                                        const labels = clickedPoint.id.split('|');
                                        const selection = {};
                                        labels.forEach((label, index) => {
                                            const dim = dimensions[index];
                                            const matchingRow = data.find((item) => item[dim.key]?.label === label);
                                            if (dim && matchingRow) {
                                                selection[dim.id] = matchingRow[dim.key].id;
                                            }
                                        });
                                        linkedAnalysis.setFilters(selection);
                                        return;
                                    }

                                    const labels = rootId.split('|');
                                    const selection = {};
                                    labels.forEach((label, index) => {
                                        const dim = dimensions[index];
                                        const matchingRow = data.find((item) => item[dim.key]?.label === label);
                                        if (dim && matchingRow) {
                                            selection[dim.id] = matchingRow[dim.key].id;
                                        }
                                    });
                                    linkedAnalysis.setFilters(selection);
                                }
                            }
                        }
                    }
                },
                series
            };
            this._chart = Highcharts.chart(this.shadowRoot.getElementById('container'), chartOptions);

            const container = this.shadowRoot.getElementById('container');

            container.addEventListener("mouseenter", () => {
                if (this._chart) {
                    this._chart.update(
                        {
                            exporting: {
                                buttons: {
                                    contextButton: {
                                        enabled: true,
                                        symbol: 'contextButton',
                                        menuItems: ['resetFilters']
                                    },
                                },
                            },
                        },
                        true
                    );
                }
            });

            container.addEventListener("mouseleave", () => {
                if (this._chart) {
                    this._chart.update(
                        {
                            exporting: {
                                buttons: {
                                    contextButton: {
                                        enabled: false,
                                    },
                                },
                            },
                        },
                        true
                    );
                }
            });
        }
    }
    customElements.define('com-sap-sample-treemap', Treemap);
})();