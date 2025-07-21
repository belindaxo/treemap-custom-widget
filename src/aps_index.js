const defaultColors = ['#004b8d', '#939598', '#faa834', '#00aa7e', '#47a5dc', '#006ac7', '#ccced2', '#bf8028', '#00e4a7'];
(function () {
    /**
     * Template for the Styling Panel (APS) of the Funnel3D widget.
     */
    let template = document.createElement('template');
    template.innerHTML = `
        <form id="form">
        <legend style="font-weight: bold;font-size: 18px;"> Font </legend>
        <table>
            <tr>
                <td>Chart Title</td>
            </tr>
            <tr>
                <td><input id="chartTitle" type="text"></td>
            </tr>
            <tr>
                <table>
                    <tr>
                        <td>Size</td>
                        <td>Font Style</td>
                        <td>Alignment</td>
                        <td>Color</td>
                    </tr>
                    <tr>
                        <td>
                            <select id="titleSize">
                                <option value="10px">10</option>
                                <option value="12px">12</option>
                                <option value="14px">14</option>
                                <option value="16px" selected>16</option>
                                <option value="18px">18</option>
                                <option value="20px">20</option>
                                <option value="22px">22</option>
                                <option value="24px">24</option>
                                <option value="32px">32</option>
                                <option value="48px">48</option>
                            </select>
                        </td>
                        <td>
                            <select id="titleFontStyle">
                                <option value="normal">Normal</option>
                                <option value="bold" selected>Bold</option>
                            </select>
                        </td>
                        <td>
                            <select id="titleAlignment">
                                <option value="left" selected>Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                            </select>
                        </td>
                        <td>
                            <input id="titleColor" type="color" value="#004B8D">
                        </td>
                    </tr>
                </table>
            </tr>
        </table>
        <table>
            <tr>
                <td>Chart Subtitle</td>
            </tr>
            <tr>
                <td><input id="chartSubtitle" type="text"></td>
            </tr>
            <tr>
                <table>
                    <tr>
                        <td>Size</td>
                        <td>Font Style</td>
                        <td>Alignment</td>
                        <td>Color</td>
                    </tr>
                    <tr>
                        <td>
                            <select id="subtitleSize">
                                <option value="10px">10</option>
                                <option value="11px" selected>11</option>
                                <option value="12px">12</option>
                                <option value="14px">14</option>
                                <option value="16px">16</option>
                                <option value="18px">18</option>
                                <option value="20px">20</option>
                                <option value="22px">22</option>
                                <option value="24px">24</option>
                                <option value="32px">32</option>
                                <option value="48px">48</option>
                            </select>
                        </td>
                        <td>
                            <select id="subtitleFontStyle">
                                <option value="normal" selected>Normal</option>
                                <option value="italic">Italic</option>
                            </select>
                        </td>
                        <td>
                            <select id="subtitleAlignment">
                                <option value="left" selected>Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                            </select>
                        </td>
                        <td>
                            <input id="subtitleColor" type="color" value="#000000">
                        </td>
                    </tr>
                </table>
            </tr>
        </table>
        <legend style="font-weight: bold;font-size: 18px;"> Number Formatting </legend>
        <table>
            <tr>
                <td>Scale Format</td>
            </tr>
            <tr>
                <td>
                    <select id="scaleFormat">
                        <option value="unformatted" selected>Unformatted</option>
                        <option value="k">Thousands (k)</option>
                        <option value="m">Millions (m)</option>
                        <option value="b">Billions (b)</option>
                    </select>
                </td>
            </tr>
            <tr>
                <td>Decimal Places</td>
            </tr>
            <tr>
                <td>
                    <select id="decimalPlaces">
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2" selected>2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                    </select>
                </td>
            </tr>
        </table>
        <tr>
            <button id="resetDefaults" type="button" style="margin-top: 10px; margin-bottom: 10px;">Reset to Default</button>
        </tr>
        <legend style="font-weight: bold;font-size: 18px;">Color Settings</legend>
        <table>
            <div id="categoryColorGrid" style="margin-top: 8px;"></div>
            <tr>
                <td><button type="button" id="resetColors">Reset Colors</button></td>
            </tr>
        </table>
        <input type="submit" style="display:none;">
        </form>
    `; 

    /**
     * Custom Web Component for the Styling Panel (APS) of the widget.
     * @extends HTMLElement
     */
    class TreemapAps extends HTMLElement {
        /**
         * Initializes the shadow DOM and sets up event listeners for form inputs.
         */
        constructor() {
            super();

            const DEFAULTS = {
                chartTitle: '',
                titleSize: '16px',
                titleFontStyle: 'bold',
                titleAlignment: 'left',
                titleColor: '#004B8D',
                chartSubtitle: '',
                subtitleSize: '11px',
                subtitleFontStyle: 'normal',
                subtitleAlignment: 'left',
                subtitleColor: '#000000',
                scaleFormat: 'unformatted',
                decimalPlaces: '2',
            }

            this._shadowRoot = this.attachShadow({ mode: 'open' });
            this._shadowRoot.appendChild(template.content.cloneNode(true));

            this.customColors = [];

            const colorGridContainer = this._shadowRoot.getElementById('categoryColorGrid');

            const renderCategoryColorGrid = () => {
                colorGridContainer.innerHTML = '';
                this.validCategoryNames.forEach(categoryName => {
                    const wrapper = document.createElement('div');
                    wrapper.style.display = 'flex';
                    wrapper.style.alignItems = 'center';
                    wrapper.style.marginBottom = '6px';

                    const label = document.createElement('span');
                    label.textContent = categoryName;
                    label.style.width = '140px';

                    const input = document.createElement('input');
                    input.type = 'color';
                    input.style.marginLeft = '8px';

                    const currentColor = this.customColors.find(c => c.category === categoryName)?.color;
                    const defaultIndex = this.validCategoryNames.indexOf(categoryName) % defaultColors.length;
                    input.value = currentColor || defaultColors[defaultIndex];

                    input.addEventListener('change', () => {
                        const existing = this.customColors.find(c => c.category === categoryName);
                        const updatedColor = input.value;

                        if (existing) {
                            if (updatedColor === defaultColors[defaultIndex]) {
                                this.customColors = this.customColors.filter(c => c.category !== categoryName);
                            } else {
                                existing.color = updatedColor;
                                this.customColors = [...this.customColors]; // force reactivity
                            }
                        } else if (updatedColor !== defaultColors[defaultIndex]) {
                            this.customColors = [...this.customColors, { category: categoryName, color: updatedColor }];
                        }

                        this._submit(new Event('submit'));
                    });

                    wrapper.appendChild(label);
                    wrapper.appendChild(input);
                    colorGridContainer.appendChild(wrapper);
                });
            };

            const resetColorsButton = this._shadowRoot.getElementById('resetColors');
            resetColorsButton.addEventListener('click', () => {
                this.customColors = [];
                renderCategoryColorGrid();
                this._submit(new Event('submit'));
            });

            this._shadowRoot.getElementById('form').addEventListener('submit', this._submit.bind(this));
            this._shadowRoot.getElementById('titleSize').addEventListener('change', this._submit.bind(this));
            this._shadowRoot.getElementById('titleFontStyle').addEventListener('change', this._submit.bind(this));
            this._shadowRoot.getElementById('titleAlignment').addEventListener('change', this._submit.bind(this));
            this._shadowRoot.getElementById('titleColor').addEventListener('change', this._submit.bind(this));
            this._shadowRoot.getElementById('subtitleSize').addEventListener('change', this._submit.bind(this));
            this._shadowRoot.getElementById('subtitleFontStyle').addEventListener('change', this._submit.bind(this));
            this._shadowRoot.getElementById('subtitleAlignment').addEventListener('change', this._submit.bind(this));
            this._shadowRoot.getElementById('subtitleColor').addEventListener('change', this._submit.bind(this));
            this._shadowRoot.getElementById('scaleFormat').addEventListener('change', this._submit.bind(this));
            this._shadowRoot.getElementById('decimalPlaces').addEventListener('change', this._submit.bind(this));

            // Reset button logic
            this._shadowRoot.getElementById('resetDefaults').addEventListener('click', () => {
                for (const key in DEFAULTS) {
                    if (key === 'chartTitle' || key === 'chartSubtitle') {
                        continue; // Skip these fields
                    }

                    const element = this._shadowRoot.getElementById(key);
                    if (!element) continue; 

                    if (typeof DEFAULTS[key] === 'boolean') {
                        element.checked = DEFAULTS[key];
                    } else {
                        element.value = DEFAULTS[key];
                    }
                }
                this._submit(new Event('submit')); 
            });

            this._renderCategoryColorGrid = renderCategoryColorGrid; // Store the function for later use
            renderCategoryColorGrid(); // Initial render of the category color grid
        }

        /**
         * Handles the form submissions and dispatches a 'propertiesChanged' event.
         * @param {Event} e - The form submission event.
         */
        _submit(e) {
            e.preventDefault();
            this.dispatchEvent(new CustomEvent('propertiesChanged', {
                detail: {
                    properties: {
                        chartTitle: this.chartTitle,
                        titleSize: this.titleSize,
                        titleFontStyle: this.titleFontStyle,
                        titleAlignment: this.titleAlignment,
                        titleColor: this.titleColor,
                        chartSubtitle: this.chartSubtitle,
                        subtitleSize: this.subtitleSize,
                        subtitleFontStyle: this.subtitleFontStyle,
                        subtitleAlignment: this.subtitleAlignment,
                        subtitleColor: this.subtitleColor,
                        scaleFormat: this.scaleFormat,
                        decimalPlaces: this.decimalPlaces,
                        customColors: this.customColors,
                        validCategoryNames: this.validCategoryNames
                    }
                }
            }));
        }

        // Getters and setters for each property
        get chartTitle() {
            return this._shadowRoot.getElementById('chartTitle').value;
        }
        set chartTitle(value) {
            this._shadowRoot.getElementById('chartTitle').value = value;
        }

        get titleSize() {
            return this._shadowRoot.getElementById('titleSize').value;
        }
        set titleSize(value) {
            this._shadowRoot.getElementById('titleSize').value = value;
        }

        get titleFontStyle() {
            return this._shadowRoot.getElementById('titleFontStyle').value;
        }
        set titleFontStyle(value) {
            this._shadowRoot.getElementById('titleFontStyle').value = value;
        }

        get titleAlignment() {
            return this._shadowRoot.getElementById('titleAlignment').value;
        }
        set titleAlignment(value) {
            this._shadowRoot.getElementById('titleAlignment').value = value;
        }
        
        get titleColor() {
            return this._shadowRoot.getElementById('titleColor').value;
        }
        set titleColor(value) {
            this._shadowRoot.getElementById('titleColor').value = value;
        }

        get chartSubtitle() {
            return this._shadowRoot.getElementById('chartSubtitle').value;
        }
        set chartSubtitle(value) {
            this._shadowRoot.getElementById('chartSubtitle').value = value;
        }

        get subtitleSize() {
            return this._shadowRoot.getElementById('subtitleSize').value;
        }
        set subtitleSize(value) {
            this._shadowRoot.getElementById('subtitleSize').value = value;
        }

        get subtitleFontStyle() {
            return this._shadowRoot.getElementById('subtitleFontStyle').value;
        }
        set subtitleFontStyle(value) {
            this._shadowRoot.getElementById('subtitleFontStyle').value = value;
        }

        get subtitleAlignment() {
            return this._shadowRoot.getElementById('subtitleAlignment').value;
        }
        set subtitleAlignment(value) {
            this._shadowRoot.getElementById('subtitleAlignment').value = value;
        }

        get subtitleColor() {
            return this._shadowRoot.getElementById('subtitleColor').value;
        }
        set subtitleColor(value) {
            this._shadowRoot.getElementById('subtitleColor').value = value;
        }

        get scaleFormat() {
            return this._shadowRoot.getElementById('scaleFormat').value;
        }
        set scaleFormat(value) {
            this._shadowRoot.getElementById('scaleFormat').value = value;
        }

        get decimalPlaces() {
            return this._shadowRoot.getElementById('decimalPlaces').value;
        }
        set decimalPlaces(value) {
            this._shadowRoot.getElementById('decimalPlaces').value = value;
        }

        get customColors() {
            return this._customColors || [];
        }
        set customColors(value) {
            this._customColors = value || [];
            if (this._renderCategoryColorGrid && this._validCategoryNames) {
                this._renderCategoryColorGrid(); // rebuild UI on update
            }
        }

        get validCategoryNames() {
            return this._validCategoryNames || [];
        }
        set validCategoryNames(value) {
            this._validCategoryNames = value || [];
            if (this._renderCategoryColorGrid && this._customColors) {
                this._renderCategoryColorGrid(); // rebuild UI on update
            }
        }
    }
    customElements.define('com-sap-sample-treemap-aps', TreemapAps);
})();