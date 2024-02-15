import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {

  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderItemModel.destroy({
      where: {
        order_id: entity.id,
      }
    });

    entity.items.forEach(async (item) => {

      await OrderItemModel.create(
        {
            id: item.id,
            name: item.name,
            price: item.price,
            product_id: item.productId,
            quantity: item.quantity,
            order_id: entity.id,
        }
      );
  
    });

    await OrderModel.update(
      {
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        where: {
          id: entity.id,
        }
      }
    );
  }

  async find(id: string): Promise<Order> {
    let om: OrderModel;
    try {
      om = await OrderModel.findOne({
        where: {
          id,
        },
        rejectOnEmpty: true,
        include: OrderItemModel,
      });
    } catch (error) {
      throw new Error("Order not found");
    }

    let ordemsItem: OrderItem[];    
    ordemsItem = om.items.map((orderItemModel: OrderItemModel) => {
      const ordemItem = new OrderItem(
        orderItemModel.id,
        orderItemModel.name,
        orderItemModel.price,
        orderItemModel.quantity,
        orderItemModel.product_id
      );
      return ordemItem;
    });
    
    let order = new Order(id, om.customer_id, ordemsItem);

    return order;
  }

  async findAll(): Promise<Order[]> {
    let orderModels: OrderModel[] = await OrderModel.findAll({include: OrderItemModel});

      const orders: Order[] = orderModels.map((om: OrderModel) => {

      let ordemsItem: OrderItem[];    
      ordemsItem = om.items.map((orderItemModel: OrderItemModel) => {
        const ordemItem = new OrderItem(
          orderItemModel.id,
          orderItemModel.name,
          orderItemModel.price,
          orderItemModel.quantity,
          orderItemModel.product_id
        );
        return ordemItem;
      });
  
      let order = new Order(om.id, om.customer_id, ordemsItem);
      
      return order;
    });

    return orders;
  }
}
