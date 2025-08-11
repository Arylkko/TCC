/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2922503523")

  // add field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2280659052",
    "hidden": false,
    "id": "relation1360761684",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "livroPK",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number1763395362",
    "max": 5,
    "min": 0,
    "name": "avaliacao",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2922503523")

  // remove field
  collection.fields.removeById("relation1360761684")

  // remove field
  collection.fields.removeById("number1763395362")

  return app.save(collection)
})
