/**
 * Processes the input data to create a structured series for a treemap.
 * @param {Array} data - The input data array containing rows of data.
 * @param {Array} dimensions - An array of dimension objects, each containing a key and label.
 * @param  {Object} measure - An object representing the measure with a key and label.
 * @param {Object} labelMeasure - An optional second measure used for labels/tooltips
 * @returns {Array} An array of structured series data for the heatmap.
 */
export function processSeriesData(data, dimensions, measure, labelMeasure) {
    const seriesData = [];
    const nodeMap = new Map();

    data.forEach(row => {
        let parentId = '';
        let pathId = '';

        dimensions.forEach((dim, level) => {
            const value = row[dim.key]?.label || `Unknown-${level}`;
            pathId += (pathId ? '|' : '') + value;

            if (!nodeMap.has(pathId)) {
                nodeMap.set(pathId, true);

                const node = {
                    id: pathId,
                    parent: parentId || undefined,
                    name: value,
                    description: dim.description || ''
                };

                // Add value only on leaf nodes
                if (level === dimensions.length - 1) {
                    const raw = row[measure.key]?.raw;
                    const val = (typeof raw === 'number' && isFinite(raw)) ? raw : 0;
                    node.value = val;
                }

                // Optional secondary measure: for labels/tooltip only
                if (labelMeasure) {
                    const raw2 = row[labelMeasure.key]?.raw;
                    const val2 = (typeof raw2 === 'number' && isFinite(raw2)) ? raw2 : 0;
                    if (val2 !== null) {
                        // Custom field used in labels/tooltips
                        node.secondaryRaw = val2;
                    }
                }

                seriesData.push(node);
            }

            parentId = pathId;
        });
    });

    return seriesData;
}