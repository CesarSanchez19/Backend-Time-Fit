import ProductSale from '../models/ProductSale.js';
import Product from '../models/Product.js';
import Client from '../models/Clients.js';
import Admin from '../models/Admin.js';
import Colaborator from '../models/Colaborator.js';

// ✅ Vender producto (admin y colaborador) - MEJORADO
export const sellProduct = async (req, res) => {
  try {
    const { id: user_id, role, gym_id } = req.user;
    const {
      product_id,
      quantity_sold,
      sale_code,
      sale_price,
      client_id,
      client_name,
      seller_id,
      seller_name
    } = req.body;

    console.log('Datos recibidos para venta:', req.body);

    // Validaciones básicas
    if (!product_id || !quantity_sold || !sale_code || !client_id) {
      return res.status(400).json({ 
        message: "Datos requeridos: product_id, quantity_sold, sale_code, client_id" 
      });
    }

    if (quantity_sold <= 0) {
      return res.status(400).json({ 
        message: "La cantidad vendida debe ser mayor a 0" 
      });
    }

    // Verificar que el producto existe y pertenece al gimnasio
    const product = await Product.findOne({ _id: product_id, gym_id });
    if (!product) {
      return res.status(404).json({ 
        message: "Producto no encontrado o no pertenece a tu gimnasio" 
      });
    }

    // Verificar stock disponible
    if (product.stock.quantity < quantity_sold) {
      return res.status(400).json({ 
        message: `Stock insuficiente. Stock disponible: ${product.stock.quantity} ${product.stock.unit}` 
      });
    }

    // Verificar que el cliente existe y pertenece al gimnasio
    const client = await Client.findOne({ _id: client_id, gym_id });
    if (!client) {
      return res.status(404).json({ 
        message: "Cliente no encontrado o no pertenece a tu gimnasio" 
      });
    }

    // Verificar que el código de venta es único
    const existingSale = await ProductSale.findOne({ sale_code });
    if (existingSale) {
      return res.status(400).json({ 
        message: "El código de venta ya existe. Genera uno nuevo." 
      });
    }

    // Calcular precio total (usar el precio enviado o el del producto)
    const unitPrice = sale_price ? parseFloat(sale_price) / quantity_sold : product.price.amount;
    const totalSale = unitPrice * quantity_sold;

    // Obtener nombre completo del cliente
    const fullClientName = client.full_name 
      ? `${client.full_name.first || ''} ${client.full_name.last_father || ''} ${client.full_name.last_mother || ''}`.trim()
      : client_name || 'Cliente sin nombre';

    // Obtener información del vendedor
    let sellerInfo = { name: seller_name || 'Vendedor', role: role };
    if (role === 'Administrador') {
      const admin = await Admin.findById(user_id, 'name last_name');
      if (admin) {
        sellerInfo.name = `${admin.name || ''} ${admin.last_name || ''}`.trim();
      }
    } else if (role === 'Colaborador') {
      const colaborator = await Colaborator.findById(user_id, 'name last_name');
      if (colaborator) {
        sellerInfo.name = `${colaborator.name || ''} ${colaborator.last_name || ''}`.trim();
      }
    }

    // Crear la venta
    const productSale = new ProductSale({
      product_id,
      product_name: product.name_product,
      unit_price: unitPrice,
      quantity_sold,
      sale_code,
      client_id,
      client_name: fullClientName,
      seller_id: user_id,
      seller_name: sellerInfo.name,
      seller_role: role,
      total_sale: totalSale,
      gym_id,
      registered_by_id: user_id,
      registered_by_type: role
    });

    await productSale.save();

    // 🆕 ACTUALIZAR STOCK Y VENTAS OBTENIDAS DEL PRODUCTO
    const newQuantity = product.stock.quantity - quantity_sold;
    const newStatus = newQuantity === 0 ? 'Agotado' : product.status;
    const newSalesObtained = (product.sales_obtained || 0) + quantity_sold;

    await Product.findByIdAndUpdate(
      product_id,
      { 
        'stock.quantity': newQuantity,
        status: newStatus,
        sales_obtained: newSalesObtained, // 🔥 INCREMENTAR VENTAS OBTENIDAS
        updated_by_id: user_id,
        updated_by_type: role,
        updated_at: new Date()
      }
    );

    // Poblar la venta con referencias
    const populatedSale = await ProductSale.findById(productSale._id)
      .populate('product_id', 'name_product price category sales_obtained')
      .populate('client_id', 'full_name email phone')
      .populate('gym_id', 'name_gym');

    res.status(201).json({
      message: "Venta registrada exitosamente",
      sale: populatedSale,
      product_updated: {
        id: product_id,
        name: product.name_product,
        previous_stock: product.stock.quantity,
        new_stock: newQuantity,
        previous_sales: product.sales_obtained || 0,
        new_sales: newSalesObtained, // 🔥 MOSTRAR NUEVAS VENTAS
        status: newStatus
      }
    });

  } catch (err) {
    console.error("Error procesando venta:", err);
    res.status(500).json({ 
      message: "Error interno del servidor", 
      error: err.message 
    });
  }
};

// ✅ Obtener todas las ventas del gimnasio (admin y colaborador)
export const getAllSales = async (req, res) => {
  try {
    const { gym_id } = req.user;

    if (!gym_id) {
      return res.status(400).json({ message: "El usuario no tiene un gimnasio asignado." });
    }

    // Obtener parámetros de filtrado opcionales
    const { 
      status, 
      start_date, 
      end_date, 
      client_id, 
      product_id,
      page = 1, 
      limit = 50 
    } = req.query;

    // Construir filtros
    const filters = { gym_id };
    
    if (status) filters.sale_status = status;
    if (client_id) filters.client_id = client_id;
    if (product_id) filters.product_id = product_id;
    
    if (start_date || end_date) {
      filters.sale_date = {};
      if (start_date) filters.sale_date.$gte = new Date(start_date);
      if (end_date) filters.sale_date.$lte = new Date(end_date);
    }

    // Calcular paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener ventas con populate (incluyendo sales_obtained)
    const sales = await ProductSale.find(filters)
      .populate('product_id', 'name_product price category stock sales_obtained')
      .populate('client_id', 'full_name email phone status')
      .populate('gym_id', 'name_gym')
      .sort({ sale_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total de ventas
    const totalSales = await ProductSale.countDocuments(filters);

    // Calcular estadísticas
    const stats = await ProductSale.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          total_revenue: { $sum: '$total_sale' },
          total_products_sold: { $sum: '$quantity_sold' },
          avg_sale_amount: { $avg: '$total_sale' }
        }
      }
    ]);

    const salesStats = stats[0] || {
      total_revenue: 0,
      total_products_sold: 0,
      avg_sale_amount: 0
    };

    res.json({
      message: "Ventas obtenidas exitosamente",
      sales,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(totalSales / parseInt(limit)),
        total_sales: totalSales,
        per_page: parseInt(limit)
      },
      statistics: {
        total_revenue: salesStats.total_revenue,
        total_products_sold: salesStats.total_products_sold,
        average_sale_amount: Math.round(salesStats.avg_sale_amount * 100) / 100
      }
    });

  } catch (err) {
    console.error("Error obteniendo ventas:", err);
    res.status(500).json({ 
      message: "Error interno del servidor", 
      error: err.message 
    });
  }
};

// ✅ Obtener venta por ID (admin y colaborador)
export const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const { gym_id } = req.user;

    if (!id) {
      return res.status(400).json({ message: "ID de la venta requerido" });
    }

    const sale = await ProductSale.findById(id)
      .populate('product_id', 'name_product price category stock barcode sales_obtained')
      .populate('client_id', 'full_name email phone status membership_id')
      .populate('gym_id', 'name_gym address')
      .populate({
        path: 'client_id',
        populate: {
          path: 'membership_id',
          select: 'name_membership duration_days price'
        }
      });

    if (!sale) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // Verificar que la venta pertenezca al mismo gimnasio
    if (sale.gym_id._id.toString() !== gym_id.toString()) {
      return res.status(403).json({ 
        message: "No tienes permiso para acceder a esta venta" 
      });
    }

    res.json({
      message: "Venta obtenida exitosamente",
      sale
    });

  } catch (err) {
    console.error("Error obteniendo venta por ID:", err);
    res.status(500).json({ 
      message: "Error interno del servidor", 
      error: err.message 
    });
  }
};

// ✅ Cancelar venta (solo admin) - MEJORADO
export const cancelSale = async (req, res) => {
  try {
    const { id, reason } = req.body;
    const { id: user_id, role, gym_id } = req.user;

    if (!id) {
      return res.status(400).json({ message: "ID de la venta requerido" });
    }

    // Buscar la venta
    const sale = await ProductSale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // Verificar que la venta pertenezca al mismo gimnasio
    if (sale.gym_id.toString() !== gym_id.toString()) {
      return res.status(403).json({ 
        message: "No tienes permiso para cancelar esta venta" 
      });
    }

    // Verificar que la venta no esté ya cancelada
    if (sale.sale_status === 'Cancelada') {
      return res.status(400).json({ 
        message: "Esta venta ya está cancelada" 
      });
    }

    // Buscar el producto para devolver el stock y restar las ventas
    const product = await Product.findById(sale.product_id);
    if (product) {
      // 🆕 DEVOLVER STOCK Y RESTAR VENTAS OBTENIDAS
      const newQuantity = product.stock.quantity + sale.quantity_sold;
      const newStatus = product.status === 'Agotado' && newQuantity > 0 ? 'Activo' : product.status;
      const newSalesObtained = Math.max(0, (product.sales_obtained || 0) - sale.quantity_sold);

      await Product.findByIdAndUpdate(
        sale.product_id,
        { 
          'stock.quantity': newQuantity,
          status: newStatus,
          sales_obtained: newSalesObtained, // 🔥 RESTAR VENTAS OBTENIDAS
          updated_by_id: user_id,
          updated_by_type: role,
          updated_at: new Date()
        }
      );
    }

    // Actualizar la venta
    const updatedSale = await ProductSale.findByIdAndUpdate(
      id,
      { 
        sale_status: 'Cancelada',
        cancellation_reason: reason || 'Sin razón especificada',
        cancelled_by_id: user_id,
        cancelled_by_type: role,
        cancelled_at: new Date(),
        updated_by_id: user_id,
        updated_by_type: role
      },
      { new: true }
    ).populate('product_id').populate('client_id');

    res.json({
      message: "Venta cancelada exitosamente",
      sale: updatedSale,
      product_restored: product ? {
        product_name: product.name_product,
        quantity_restored: sale.quantity_sold,
        new_stock: product.stock.quantity + sale.quantity_sold,
        previous_sales: product.sales_obtained + sale.quantity_sold,
        new_sales: Math.max(0, (product.sales_obtained || 0) - sale.quantity_sold) // 🔥 MOSTRAR VENTAS ACTUALIZADAS
      } : null
    });

  } catch (err) {
    console.error("Error cancelando venta:", err);
    res.status(500).json({ 
      message: "Error interno del servidor", 
      error: err.message 
    });
  }
};

// ✅ Eliminar venta del historial (solo admin) - Solo ventas canceladas
export const deleteSale = async (req, res) => {
  try {
    const { id } = req.body;
    const { gym_id } = req.user;

    if (!id) {
      return res.status(400).json({ message: "ID de la venta requerido" });
    }

    // Buscar la venta primero
    const existingSale = await ProductSale.findById(id)
      .populate('product_id', 'name_product')
      .populate('client_id', 'full_name');

    if (!existingSale) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // Verificar que la venta pertenezca al mismo gimnasio
    if (existingSale.gym_id.toString() !== gym_id.toString()) {
      return res.status(403).json({ 
        message: "No tienes permiso para eliminar esta venta" 
      });
    }

    // 🔥 VALIDACIÓN PRINCIPAL: Solo se pueden eliminar ventas canceladas
    if (existingSale.sale_status !== 'Cancelada') {
      return res.status(400).json({ 
        message: "Solo se pueden eliminar ventas que estén en estado 'Cancelada'.",
        details: "Para eliminar esta venta del historial, primero debe ser cancelada.",
        ventaInfo: {
          codigo: existingSale.sale_code,
          estado: existingSale.sale_status,
          fecha: existingSale.sale_date.toLocaleDateString('es-MX'),
          cliente: existingSale.client_name,
          producto: existingSale.product_name,
          total: `$${existingSale.total_sale}`
        }
      });
    }

    // Si llegamos aquí, la venta está cancelada y puede eliminarse
    await ProductSale.findByIdAndDelete(id);

    console.log(`✅ Venta eliminada del historial: ${existingSale.sale_code} - Estado: ${existingSale.sale_status}`);

    res.json({ 
      message: "Venta eliminada del historial exitosamente",
      deletedSale: {
        id: existingSale._id,
        sale_code: existingSale.sale_code,
        product_name: existingSale.product_name,
        client_name: existingSale.client_name,
        quantity_sold: existingSale.quantity_sold,
        total_sale: existingSale.total_sale,
        sale_date: existingSale.sale_date.toLocaleDateString('es-MX'),
        cancelled_at: existingSale.cancelled_at?.toLocaleDateString('es-MX'),
        cancellation_reason: existingSale.cancellation_reason
      }
    });

  } catch (err) {
    console.error("Error eliminando venta del historial:", err);
    res.status(500).json({ 
      message: "Error interno del servidor", 
      error: err.message 
    });
  }
};

// ✅ Eliminar múltiples ventas canceladas (solo admin)
export const deleteMultipleCancelledSales = async (req, res) => {
  try {
    const { sale_ids, confirm_deletion } = req.body;
    const { gym_id } = req.user;

    if (!sale_ids || !Array.isArray(sale_ids) || sale_ids.length === 0) {
      return res.status(400).json({ 
        message: "Se requiere un array de IDs de ventas para eliminar" 
      });
    }

    // Buscar todas las ventas
    const sales = await ProductSale.find({ 
      _id: { $in: sale_ids }, 
      gym_id 
    });

    if (sales.length === 0) {
      return res.status(404).json({ message: "No se encontraron ventas válidas" });
    }

    // Verificar que todas las ventas estén canceladas
    const nonCancelledSales = sales.filter(sale => sale.sale_status !== 'Cancelada');
    
    if (nonCancelledSales.length > 0) {
      const invalidSales = nonCancelledSales.map(sale => ({
        codigo: sale.sale_code,
        estado: sale.sale_status,
        cliente: sale.client_name,
        fecha: sale.sale_date.toLocaleDateString('es-MX')
      }));

      return res.status(400).json({ 
        message: "No se pueden eliminar todas las ventas porque algunas no están canceladas.",
        details: "Solo las ventas en estado 'Cancelada' pueden ser eliminadas del historial.",
        ventasNoValidas: invalidSales,
        totalVentasNoValidas: nonCancelledSales.length,
        totalVentasSeleccionadas: sales.length
      });
    }

    // Si no se confirmó la eliminación, solo mostrar resumen
    if (!confirm_deletion) {
      const salesSummary = sales.map(sale => ({
        codigo: sale.sale_code,
        producto: sale.product_name,
        cliente: sale.client_name,
        total: `$${sale.total_sale}`,
        fechaCancelacion: sale.cancelled_at?.toLocaleDateString('es-MX')
      }));

      return res.json({
        message: "Resumen de ventas que serán eliminadas",
        details: "Para confirmar la eliminación, envía 'confirm_deletion: true' en el body de la request.",
        ventasAEliminar: salesSummary,
        totalVentas: sales.length,
        totalImporte: sales.reduce((sum, sale) => sum + sale.total_sale, 0)
      });
    }

    // Proceder con la eliminación
    const deletedSales = await ProductSale.deleteMany({ 
      _id: { $in: sale_ids }, 
      gym_id,
      sale_status: 'Cancelada'
    });

    console.log(`✅ ${deletedSales.deletedCount} ventas canceladas eliminadas del historial`);

    res.json({
      message: `${deletedSales.deletedCount} ventas eliminadas del historial exitosamente`,
      deletedCount: deletedSales.deletedCount,
      requestedCount: sale_ids.length
    });

  } catch (err) {
    console.error("Error eliminando ventas múltiples:", err);
    res.status(500).json({ 
      message: "Error interno del servidor", 
      error: err.message 
    });
  }
};