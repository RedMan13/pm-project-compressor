const JSZip = require('jszip')
const defaultSprite = require('./emptySprite.js')
const defaultSave = require('./emptySave.js')

const dataPrefix = 'data:application/octet-stream;base64,'

/**
 * compresses pm files into saves that will load in all the sprites and stuff of the save being compressed
 * @param {Buffer} saveData the save data to compress
 * @param {boolean} debug wether or not to put info data out to the console
 * @returns {Promise}
 */
const compiler = (saveData, debug) => 
    JSZip.loadAsync(saveData)
        .then(async saveZip => {
            const saveInfoRaw = await saveZip.file('project.json').async('string')
            const saveInfo = JSON.parse(saveInfoRaw)

            const zips = [new Promise(resolve => resolve([saveZip, saveInfo]))]

            for (const sprite of saveInfo.targets) {
                if (sprite.isStage) continue
                const spriteZip = new JSZip()
                spriteZip.file('sprite.json', JSON.stringify(sprite))
                // copy over costumes
                for (const { md5ext: fileName } of sprite.costumes) {
                    saveZip
                        .file(fileName)
                        .async("arraybuffer")
                            .then(data => {
                                spriteZip.file(fileName, data)
                            })
                }
                // copy over sounds
                for (const { md5ext: fileName } of sprite.sounds) {
                    saveZip
                        .file(fileName)
                        .async("arraybuffer")
                            .then(data => {
                                spriteZip.file(fileName, data)
                            })
                }

                const zipPromise = spriteZip
                    .generateAsync({ type: 'base64' })
                zips.push(zipPromise)
            }
            return Promise.all(zips)
        })
        .then(data => {
            const inSaveZip = data[0][0]
            const saveInfo = data[0][1]
            const zips = data.slice(1)

            const saveZip = new JSZip()
            const newSave = JSON.parse(defaultSave)
            const loaderSprite = JSON.parse(defaultSprite)
            let prevID = 'start'

            for (
                let idx = 0, 
                    id = '0', 
                    zip = zips[0]; 
                idx < zips.length;
                id = String(++idx),
                zip = zips[idx]
            ) {
                const data = dataPrefix + zip
                loaderSprite.blocks[prevID].next = id
                loaderSprite.blocks[id] = {
                    opcode: 'jgRuntime_addSpriteUrl',
                    next: null,
                    parent: prevID,
                    inputs: {
                        URL: [1, [10, data]]
                    },
                    shadow: false,
                    topLevel: false
                }
                prevID = id
            }
            loaderSprite.blocks[prevID].next = 'deleteMe'
            loaderSprite.blocks['deleteMe'] = {
                opcode: 'jgRuntime_deleteSprite',
                next: null,
                parent: prevID,
                inputs: {
                    NAME: [1, [10, 'loader']]
                },
                fields: {},
                shadow: false,
                topLevel: false
            }
            loaderSprite.costumes.push({
                name: 'dummy',
                dataFormat: 'svg',
                assetId: 'dummyAAAAAAAAAAAAAAAAAAAAAAAAAAH',
                md5ext: 'dummyAAAAAAAAAAAAAAAAAAAAAAAAAAH.svg',
                rotationCenterX: 0,
                rotationCenterY: 0
            })

            newSave.extensions.push('jgRuntime')
            newSave.targets.push(saveInfo.targets[0])
            newSave.targets.push(loaderSprite)

            // copy over costumes
            for (const { md5ext: fileName } of saveInfo.targets[0].costumes) {
                inSaveZip
                    .file(fileName)
                    .async("arraybuffer")
                        .then(data => {
                            saveZip.file(fileName, data)
                        })
            }
            // copy over sounds
            for (const { md5ext: fileName } of saveInfo.targets[0].sounds) {
                inSaveZip
                    .file(fileName)
                    .async("arraybuffer")
                        .then(data => {
                            saveZip.file(fileName, data)
                        })
            }
            
            saveZip.file('project.json', JSON.stringify(newSave))
            saveZip.file('dummyAAAAAAAAAAAAAAAAAAAAAAAAAAH.svg', '<svg></svg>')
            return saveZip.generateAsync({
                type: 'nodebuffer'
            })
        })

module.exports = compiler