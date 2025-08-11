/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2280659052")

  // add field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2922503523",
    "hidden": false,
    "id": "relation3704737080",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "notafk",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2280659052")

  // remove field
  collection.fields.removeById("relation3704737080")

  return app.save(collection)
})
