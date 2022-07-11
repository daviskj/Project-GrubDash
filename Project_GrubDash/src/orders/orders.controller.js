const path = require("path")
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"))
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId")


// middleware for checking if there is a delivery location for order
function bodyHasDeliverProp(req, res, next) {
  const { data: { deliverTo } = {} } = req.body
  if (deliverTo) {
    res.locals.deliverTo = deliverTo
    return next()
  }
  next({
    status: 400,
    message: `A 'deliverTo' property is required.`,
  })
}

// middleware for checking if there is a phone number associated with the order
function bodyHasMobileNumber(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body
  if (mobileNumber) {
    res.locals.mobileNumber = mobileNumber
    return next()
  }
  next({
    status: 400,
    message: `A 'mobileNumber' property is required.`,
  })
}

// middleware for checking if the order has status
function bodyHasStatus(req, res, next) {
  const { data: { status } = {} } = req.body
  if (status) {
    res.locals.status = status
    return next()
  }
  next({
    status: 400,
    message: `A 'status' property is required.`,
  })
}

// middleware for checking if the status is in the correct format
function dataStringIsValid(req, res, next) {
  const { data: { status } = {} } = req.body
  if (
    status.includes("pending") ||
    status.includes("preparing") ||
    status.includes("out-for-delivery") ||
    status.includes("delivered")

  ) {
    res.locals.status = status
    return next()
  }
  next({
    status: 400,
    message: `status property must be valid string: 'pending', 'preparing', 'out-for-delivery', or 'delivered'`,
  })
}

// middleware for checking if there is a dish(s) in the order
function bodyHasDishesProp(req, res, next) {
  const { data: { dishes } = {} } = req.body
  if (dishes) {
    res.locals.dishes = dishes
    return next()
  }
  next({
    status: 400,
    message: `A 'dishes' property is required.`,
  })
}

// middleware for checking if there is a valid number of dishes in the order
function dishesArrayIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body
  // if there are no dishes return message
  if (!Array.isArray(res.locals.dishes) || res.locals.dishes.length == 0) {
    next({
      status: 400,
      message: `invalid dishes property: dishes property must be non-empty array`,
    })
  }
  next()
}

// middleware for checking if there is a valid quantity of a given dish
function dishesArrayLengthIsValid(req, res, next) {
  const { data: { dishes } = {} } = req.body
  dishes.forEach((dish) => {
    const quantity = dish.quantity
    // if the dish is not in the order or they want 0, return message
    if (!quantity || quantity <= 0 || typeof quantity !== "number") {
      return next({
        status: 400,
        message: `dish ${dish.id} must have quantity property, 
        quantity must be an integer, and it must not be equal to or less than 0`,
      })
    }
  })
  next()
}

// middleware for checking if the order and data for the order match
function dataIdMatchesOrderId(req, res, next) {
  const { data: { id } = {} } = req.body
  const orderId = req.params.orderId
  if (id !== undefined && id !== null && id !== "" && id !== orderId) {
    next({
      status: 400,
      message: `id ${id} must match orderId provided in parameters`,
    })
  }
  return next()
}

// middleware for checking if the order exists
function orderExists(req, res, next) {
  const orderId = req.params.orderId
  const matchingOrder = orders.find((order) => order.id === orderId)
  if (matchingOrder) {
    res.locals.order = matchingOrder
    return next()
  }
  next({
    status: 404,
    message: `Order id not found: ${req.params.orderId}`,
  })
}




// handler for listing the all of the orders
function list(req, res) {
  res.json({ data: orders })
}

// handler for updating an order
function update(req, res) {
  const orderId = req.params.orderId
  const matchingOrder = orders.find((order) => order.id === orderId)
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body
  matchingOrder.deliverTo = deliverTo
  matchingOrder.mobileNumber = mobileNumber
  matchingOrder.status = status
  matchingOrder.dishes = dishes
  res.json({ data: matchingOrder })
}

// handler for reading the orders
function read(req, res) {
  const orderId = req.params.orderId
  const matchingOrder = orders.find((order) => order.id === orderId)
  res.json({ data: matchingOrder })
}

// handler for making a new order
function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status: "out-for-delivery",
    dishes,
  }
  orders.push(newOrder)
  res.status(201).json({ data: newOrder })
}

// handler for deleting an order
function destroy(req, res, next) {
  const { orderId } = req.params
  const matchingOrder = orders.find((order) => order.id === orderId)
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } =
    req.body
  if (matchingOrder.status === "pending") {
    const index = orders.findIndex((order) => order.id === Number(orderId))
    orders.splice(index, 1)
    res.sendStatus(204)
  }
  return next({
    status: 400,
    message: `order cannot be deleted unless order status = 'pending'`,
  })
}

module.exports = {
  list,
  read: [orderExists, read],
  create: [
    bodyHasDeliverProp,
    bodyHasMobileNumber,
    bodyHasDishesProp,
    dishesArrayIsValid,
    dishesArrayLengthIsValid,
    create,
  ],
  update: [
    orderExists,
    dataIdMatchesOrderId,
    bodyHasDeliverProp,
    bodyHasMobileNumber,
    bodyHasDishesProp,
    bodyHasStatus,
    dataStringIsValid,
    dishesArrayIsValid,
    dishesArrayLengthIsValid,
    update,
  ],
  delete: [orderExists, destroy],
}