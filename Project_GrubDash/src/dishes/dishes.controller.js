const path = require("path")
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"))
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId")


function bodyHasName(req, res, next) {
  const { data: { name } = {} } = req.body
  if (name) {
    res.locals.name = name
    return next()
  }
  next({
    status: 400,
    message: `A 'name'property is required.`,
  })
}

// middleware for checking if the dish has an image property
function bodyHasImg(req, res, next) {
  const { data: { image_url } = {} } = req.body
  if (image_url) {
    res.locals.image_url = image_url
    return next()
  }
  next({
    status: 400,
    message: `A 'image_url' property is required.`,
  })
}

function bodyHasPrice(req, res, next) {
  const {data: {price} = {} } = req.body
  if(price) {
    res.locals.price = price
    return next()
  }
  next({
    status: 400,
    message: `A 'price' property is required.`,
  })
}

// middleware for checking if the dish has a description
function bodyHasDescription(req, res, next) {
  const { data: { description } = {} } = req.body
  if (description) {
    res.locals.description = description
    return next()
  }
  next({
    status: 400,
    message: `A 'description' property is required.`,
  })
}

// middleware for checking if the dish has a valid price property
function bodyHasValidPrice(req, res, next) {
  const { data: { price } = {} } = req.body
  if (price > 0) {
    res.locals.price = price
    return next()
  }
  next({
    status: 400,
    message: `price cannot be less than 0`,
  })
}

// middleware for checking if the dish's price property is
function bodyHasValidPriceForUpdate(req, res, next) {
  const { data: { price } = {} } = req.body
//if the price type is not a # or if it is < $0 return message
  if (typeof res.locals.price !== "number" || res.locals.price <= 0) {
    next({
      status: 400,
      message: `type of price must be number`,
    })
  }
  return next()
}

// middleware for checking if the dish exists in the data in order to move
function dishExists(req, res, next) {
  const { dishId } = req.params
  const matchingDish = dishes.find((dish) => dish.id === dishId)
  if (matchingDish) {
    res.locals.matchingDish = matchingDish
    return next()
  }
  next({
    status: 404,
    message: `Dish id not found: ${dishId}`,
  })
}


// middleware for checking if the data id matches it's parameters id
function dishIdMatchesDataId(req, res, next) {
  const { data: { id } = {} } = req.body
  const dishId = req.params.dishId
  // if the id is defined, not null, not a string, and not the dishId
  if (id !== "" && id !== dishId && id !== null && id !== undefined) {
    // return message
    next({
      status: 400,
      message: `id ${id} must match dataId provided in parameters`,
    })
  }
  return next()
}

// handler for listing dishes
function list(req, res) {
  res.json({ data: dishes })
}

// handler for reading dishes
function read(req, res) {
  const dishId = req.params.dishId
  const matchingDish = dishes.find((dish) => dish.id === dishId)
  res.json({ data: res.locals.matchingDish })
}

// handler for creating a new dish
function create(req, res) {
  const { data: { name, price, image_url } = {} } = req.body
  const newDish = {
    id: nextId(),
    name,
    price,
    image_url,
  }

  // push the new dish onto the array of all other dishes
  dishes.push(newDish)
  // send status + the new dish object
  res.status(201).json({ data: newDish })
}

// handler for updating a dish's data
function update(req, res) {
  const dishId = req.params.dishId
  const matchingDish = dishes.find((dish) => dish.id === dishId)
  const { data: { name, description, price, image_url } = {} } = req.body
  // use that variable to define the key-value pairs of the new dish
  matchingDish.description = description
  matchingDish.name = name
  matchingDish.price = price
  matchingDish.image_url = image_url
  // return the new dish data
  res.json({ data: matchingDish })
}

module.exports = {
  list,
  read: [dishExists, read],
  create: [
    bodyHasName,
    bodyHasDescription,
    bodyHasPrice,
    bodyHasImg,
    bodyHasValidPrice,
    create,
  ],
  update: [
    dishExists,
    dishIdMatchesDataId,
    bodyHasName,
    bodyHasDescription,
    bodyHasPrice,
    bodyHasImg,
    bodyHasValidPriceForUpdate,
    update,
  ],
}