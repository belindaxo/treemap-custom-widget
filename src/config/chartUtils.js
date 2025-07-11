export function generateLevels(numLevels) {
    const levels = [];

    for (let i = 1; i <= numLevels; i++) {
        const isLeaf = i === numLevels;
        const isFirst = i === 1;

        const levelConfig = {
            level: i,
            borderWidth: isFirst ? 3 : 1,
            dataLabels: {
                enabled: true,
                align: isFirst ? 'left' : 'center',
                headers: isLeaf ? false : true,
                padding: isFirst ? 3 : 0

            },
            colorByPoint: isFirst
        }

        levels.push(levelConfig);
    }

    return levels;
}