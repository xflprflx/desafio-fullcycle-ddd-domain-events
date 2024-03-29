import { Sequelize } from "sequelize-typescript";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import OrderItemModel from "./order-item.model";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import Order from "../../../../domain/checkout/entity/order";
import Product from "../../../../domain/product/entity/product";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepository from "./order.repository";
import OrderModel from "./order.model";

describe("Order repository test", () => {
  let sequelize: Sequelize;
  let order: Order;
  let product: Product;
  let orderItem: OrderItem;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();

    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);
    const productRepository = new ProductRepository();
    product = new Product("123", "Product 1", 10);
    await productRepository.create(product);
    orderItem = new OrderItem("1", product.name, product.price, 2, product.id);
    order = new Order("123", "123", [orderItem]);
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("should update a order", async () => {
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderItem2 = new OrderItem("2", product.name, product.price, 20, product.id);
    order.items.push(orderItem2);
    await orderRepository.update(order);
    const orderModel = await OrderModel.findOne({
      where: { id: "123" },
      include: ["items"],
    });
    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total(),
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
        {
          id: orderItem2.id,
          name: orderItem2.name,
          price: orderItem2.price,
          quantity: orderItem2.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("should find a order", async () => {
    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderResult = await orderRepository.find(order.id);

    expect(order).toStrictEqual(orderResult);
  });

  it("should throw an error when order is not found", async () => {
    const orderRepository = new OrderRepository();

    expect(async () => {
      await orderRepository.find("456ABC");
    }).rejects.toThrow("Order not found");
  });


  it("should find all orders", async () => {
    const orderRepository = new OrderRepository();

    const orderItem2 = new OrderItem(
      "2",
      product.name,
      product.price,
      2,
      product.id
    );

    const order2 = new Order("2", "123", [orderItem2]);

    await orderRepository.create(order);
    await orderRepository.create(order2);

    const orders = await orderRepository.findAll();

    expect(orders).toHaveLength(2);
    expect(orders).toContainEqual(order);
    expect(orders).toContainEqual(order2);
  });  
});
