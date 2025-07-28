import ProductSale from '../models/ProductSale.js';
import Product from '../models/Product.js';
import Admin from '../models/Admin.js';
import Colaborator from '../models/Colaborator.js';

// Realizar una venta
export const sellProduct = async (req, res) => {
  try {
    const { id: user_id, role, gym_id } = req.user;
    const { product_id, quantity_sold, sale_code, sale_price, client_id, client_name } = req.body;

    // Verificar si el producto existe
    const product = await Product.findOne({ _id: product_id, gym_id });
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado en este gimnasio" });
    }

    // Verificar si hay suficiente stock
    if (product.stock.quantity < quantity_sold) {
      return res.status(400).json({ message: `Stock insuficiente. Stock disponible: ${product.stock.quantity}` });
    }

    // Actualizar el stock del producto
    product.stock.quantity -= quantity_sold;
    await product.save();

    // Crear un nuevo registro de venta
    const productSale = new ProductSale({
      product_id,
      product_name: product.name_product,
      unit_price: product.price.amount,
      quantity_sold,
      sale_code,
      client_id,
      client_name,
      sale_date: new Date(),
      seller_id: user_id,
      seller_name: req.user.name,
      seller_role: role,
      sale_status: 'Exitosa',
      total_sale: sale_price || (product.price.amount * quantity_sold),
      gym_id,
      registered_by_id: user_id,
      registered_by_type: role
    });

    await productSale.save();

    res.status(201).json({ message: "Venta registrada exitosamente", productSale });
  } catch (err) {
    console.error('Error realizando venta:', err);
    res.status(500).json({ message: 'Error interno del servidor', error: err.message });
  }
};

// Cancelar una venta (solo administrador)
export const cancelSale = async (req, res) => {
  try {
    const { sale_id } = req.body; // El ID ahora se recibe dentro del cuerpo de la solicitud
    const { gym_id } = req.user;

    // Verificar si la venta existe
    const sale = await ProductSale.findOne({ _id: sale_id, gym_id });
    if (!sale) {
      return res.status(404).json({ message: "Venta no encontrada en este gimnasio" });
    }

    // Solo el administrador puede cancelar la venta
    if (req.user.role !== 'Administrador') {
      return res.status(403).json({ message: "Acción solo permitida para administradores" });
    }

    // Eliminar la venta
    const product = await Product.findById(sale.product_id);
    product.stock.quantity += sale.quantity_sold; // Revertir stock
    await product.save();

    await ProductSale.findByIdAndDelete(sale_id);

    res.json({ message: "Venta cancelada y stock actualizado" });
  } catch (err) {
    console.error('Error cancelando venta:', err);
    res.status(500).json({ message: 'Error interno del servidor', error: err.message });
  }
};

// Obtener el detalle de una venta
export const getSaleById = async (req, res) => {
  try {
    const { id: sale_id } = req.params;
    const { gym_id } = req.user;

    // Obtener detalles de la venta
    const sale = await ProductSale.findOne({ _id: sale_id, gym_id })
      .populate('product_id', 'name_product price')
      .populate('client_id', 'full_name')
      .populate('seller_id', 'name last_name');

    if (!sale) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    res.json({ message: "Venta obtenida exitosamente", sale });
  } catch (err) {
    console.error('Error obteniendo venta:', err);
    res.status(500).json({ message: 'Error interno del servidor', error: err.message });
  }
};

// Obtener todo el historial de ventas
export const getAllSales = async (req, res) => {
  try {
    const { gym_id } = req.user;

    const sales = await ProductSale.find({ gym_id })
      .populate('product_id', 'name_product price')
      .populate('client_id', 'full_name')
      .populate('seller_id', 'name last_name')
      .sort({ sale_date: -1 });

    res.json({ message: "Historial de ventas", sales });
  } catch (err) {
    console.error('Error obteniendo ventas:', err);
    res.status(500).json({ message: 'Error interno del servidor', error: err.message });
  }
};
