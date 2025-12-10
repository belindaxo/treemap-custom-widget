/**
 * Processes the input data to create a structured series for a treemap.
 * @param {Array} data - The input data array containing rows of data.
 * @param {Array} dimensions - An array of dimension objects, each containing a key and label.
 * @param  {Array} measures - An array of measure objects, each containing a key and label.
 * @returns {Array} An array of structured series data for the heatmap.
 */
export function processSeriesData(data, dimensions, measures) {
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
                    description: dim.description || '',
                    custom: {}
                };

                // Add value only on leaf nodes
                if (level === dimensions.length - 1) {
                    const raw = row[measures[0].key]?.raw;
                    const val = (typeof raw === 'number' && isFinite(raw)) ? raw : 0;
                    node.value = val;

                    if (measures[1]) {
                        const raw2 = row[measures[1].key]?.raw;
                        const val2 = (typeof raw2 === 'number' && isFinite(raw2)) ? raw2 : 0;
                        node.custom.additionalValue = val2;
                    }
                }

                seriesData.push(node);
            }

            parentId = pathId;
        });
    });

    return seriesData;
}