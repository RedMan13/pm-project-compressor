const sprite = {
    isStage: false,
    name: 'loader',
    variables: {},
    lists: {},
    broadcasts: {},
    blocks: {
        start: {
            opcode: 'event_whenflagclicked',
            parent: null,
            inputs: {},
            fields: {},
            shadow: false,
            topLevel: true,
            x: 158,
            y: 329
        }
    },
    comments: {},
    currentCostume: 0,
    costumes: [],
    sounds: [],
    volume: 100,
    visible: false,
    x: 0,
    y: 0,
    size: 100,
    direction: 90,
    draggable: false,
    rotationStyle: 'all around'
}

module.exports = JSON.stringify(sprite)