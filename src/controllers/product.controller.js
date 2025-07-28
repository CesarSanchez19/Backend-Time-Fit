// controllers/product.controller.js
import Product from "../models/Product.js";
import ProductSale from '../models/ProductSale.js';
import Admin from '../models/Admin.js';
import Colaborator from '../models/Colaborator.js';
import { resizeBase64Image } from '../libs/resizeImage.js';

// ✅ Crear producto (admin y colaborador)
export const createProduct = async (req, res) => {
  try {
    const { id: user_id, role } = req.user;
    const {
      name_product,
      stock,
      price,
      category,
      barcode,
      purchase_date,
      status,
      supplier_id,
      image_url
    } = req.body;
    
    const gym_id = req.user.gym_id;

    if (!gym_id) {
      return res.status(400).json({ message: "El usuario no tiene un gimnasio asignado." });
    }

    // Validar campos requeridos
    if (!name_product || !stock?.quantity || !stock?.unit || !price?.amount || !category) {
      return res.status(400).json({ 
        message: "Campos requeridos: name_product, stock (quantity, unit), price (amount), category" 
      });
    }

    // Verificar si ya existe un producto con el mismo código de barras en el mismo gym
    if (barcode && barcode.trim() !== '') {
      const existingProduct = await Product.findOne({ barcode, gym_id });
      if (existingProduct) {
        return res.status(400).json({ 
          message: "Ya existe un producto con este código de barras en tu gimnasio." 
        });
      }
    }

    // Procesar imagen si se proporciona
    let processedImageUrl = '';
    if (image_url && image_url.trim() !== '') {
      try {
        // Verificar si es una imagen base64
        if (image_url.startsWith('data:image/')) {
          // Redimensionar y comprimir la imagen
          processedImageUrl = await resizeBase64Image(image_url, {
            width: 400,
            height: 400,
            quality: 85
          });
        } else {
          // Si es una URL normal, mantenerla tal como está
          processedImageUrl = image_url;
        }
      } catch (imageError) {
        console.error("Error procesando imagen:", imageError);
        return res.status(400).json({ 
          message: "Error al procesar la imagen. Verifique que sea un formato válido." 
        });
      }
    }

    const product = new Product({
      name_product,
      stock: {
        quantity: stock.quantity,
        unit: stock.unit
      },
      price: {
        amount: price.amount,
        currency: price.currency || 'MXN'
      },
      category,
      barcode: barcode || '',
      purchase_date: purchase_date ? new Date(purchase_date) : new Date(),
      status: status || 'active',
      supplier_id: supplier_id || null,
      gym_id,
      image_url: processedImageUrl,
      registered_by_id: user_id,
      registered_by_type: role
    });

    await product.save();

    res.status(201).json({
      message: "Producto creado exitosamente",
      product
    });
  } catch (err) {
    console.error("Error creando producto:", err);
    res.status(500).json({ message: "Error interno del servidor", error: err.message });
  }
};

// ✅ Obtener todos los productos del gimnasio (admin y colaborador)
export const getAllProducts = async (req, res) => {
  try {
    const gym_id = req.user.gym_id;
    
    if (!gym_id) {
      return res.status(400).json({ message: "El usuario no tiene un gimnasio asignado." });
    }

    const products = await Product.find({ gym_id })
      .populate('supplier_id')
      .populate('gym_id')
      .sort({ createdAt: -1 });

    // Mapear información adicional de auditoría
    const productsWithAuditInfo = await Promise.all(
      products.map(async product => {
        try {
          const productObj = product.toObject();
          
          // Buscar información de quien registró
          if (productObj.registered_by_id && productObj.registered_by_type) {
            let registeredByInfo = null;
            
            if (productObj.registered_by_type === 'Administrador') {
              registeredByInfo = await Admin.findById(productObj.registered_by_id, 'name last_name');
            } else if (productObj.registered_by_type === 'Colaborador') {
              registeredByInfo = await Colaborator.findById(productObj.registered_by_id, 'name last_name');
            }
            
            if (registeredByInfo) {
              productObj.registered_by_name = `${registeredByInfo.name || ''} ${registeredByInfo.last_name || ''}`.trim();
            }
          }

          // Buscar información de quien actualizó (si existe)
          if (productObj.updated_by_id && productObj.updated_by_type) {
            let updatedByInfo = null;
            
            if (productObj.updated_by_type === 'Administrador') {
              updatedByInfo = await Admin.findById(productObj.updated_by_id, 'name last_name');
            } else if (productObj.updated_by_type === 'Colaborador') {
              updatedByInfo = await Colaborator.findById(productObj.updated_by_id, 'name last_name');
            }
            
            if (updatedByInfo) {
              productObj.updated_by_name = `${updatedByInfo.name || ''} ${updatedByInfo.last_name || ''}`.trim();
            }
          }

          return productObj;
        } catch (error) {
          console.error('Error procesando producto:', product._id, error);
          return product.toObject();
        }
      })
    );

    res.json({
      message: "Productos obtenidos exitosamente",
      count: productsWithAuditInfo.length,
      products: productsWithAuditInfo
    });
  } catch (err) {
    console.error("Error obteniendo productos:", err);
    res.status(500).json({ message: "Error interno del servidor", error: err.message });
  }
};

// ✅ Obtener producto por ID (admin y colaborador)
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const gym_id = req.user.gym_id;

    if (!id) {
      return res.status(400).json({ message: "ID del producto requerido" });
    }

    const product = await Product.findById(id)
      .populate('supplier_id')
      .populate('gym_id');

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Verificar que el producto pertenezca al mismo gimnasio
    if (product.gym_id._id.toString() !== gym_id.toString()) {
      return res.status(403).json({ 
        message: "No tienes permiso para acceder a este producto" 
      });
    }

    // Agregar información de auditoría
    const productObj = product.toObject();
    
    // Buscar información de quien registró
    if (productObj.registered_by_id && productObj.registered_by_type) {
      let registeredByInfo = null;
      
      if (productObj.registered_by_type === 'Administrador') {
        registeredByInfo = await Admin.findById(productObj.registered_by_id, 'name last_name');
      } else if (productObj.registered_by_type === 'Colaborador') {
        registeredByInfo = await Colaborator.findById(productObj.registered_by_id, 'name last_name');
      }
      
      if (registeredByInfo) {
        productObj.registered_by_name = `${registeredByInfo.name || ''} ${registeredByInfo.last_name || ''}`.trim();
      }
    }

    // Buscar información de quien actualizó (si existe)
    if (productObj.updated_by_id && productObj.updated_by_type) {
      let updatedByInfo = null;
      
      if (productObj.updated_by_type === 'Administrador') {
        updatedByInfo = await Admin.findById(productObj.updated_by_id, 'name last_name');
      } else if (productObj.updated_by_type === 'Colaborador') {
        updatedByInfo = await Colaborator.findById(productObj.updated_by_id, 'name last_name');
      }
      
      if (updatedByInfo) {
        productObj.updated_by_name = `${updatedByInfo.name || ''} ${updatedByInfo.last_name || ''}`.trim();
      }
    }

    res.json({
      message: "Producto obtenido exitosamente",
      product: productObj
    });
  } catch (err) {
    console.error("Error obteniendo producto por ID:", err);
    res.status(500).json({ message: "Error interno del servidor", error: err.message });
  }
};

// ✅ Actualizar producto (admin y colaborador)
export const updateProduct = async (req, res) => {
  try {
    const { id, ...dataToUpdate } = req.body;
    const { id: user_id, role } = req.user;
    const gym_id = req.user.gym_id;

    if (!id) {
      return res.status(400).json({ message: "ID del producto requerido" });
    }

    // Registrar usuario que actualiza
    dataToUpdate.updated_by_id = user_id;
    dataToUpdate.updated_by_type = role;

    // Buscar el producto primero
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Verificar que el producto pertenezca al mismo gimnasio
    if (existingProduct.gym_id.toString() !== gym_id.toString()) {
      return res.status(403).json({ 
        message: "No tienes permiso para actualizar este producto" 
      });
    }

    // Si se actualiza el código de barras, verificar que no exista otro producto con el mismo código
    if (dataToUpdate.barcode && dataToUpdate.barcode !== existingProduct.barcode) {
      const duplicateProduct = await Product.findOne({ 
        barcode: dataToUpdate.barcode, 
        gym_id,
        _id: { $ne: id }
      });
      if (duplicateProduct) {
        return res.status(400).json({ 
          message: "Ya existe otro producto con este código de barras en tu gimnasio." 
        });
      }
    }

    // Procesar imagen si se está actualizando
    if (dataToUpdate.image_url && dataToUpdate.image_url.trim() !== '') {
      try {
        // Verificar si es una imagen base64
        if (dataToUpdate.image_url.startsWith('data:image/')) {
          // Redimensionar y comprimir la imagen
          dataToUpdate.image_url = await resizeBase64Image(dataToUpdate.image_url, {
            width: 400,
            height: 400,
            quality: 85
          });
        }
        // Si es una URL normal, se mantiene tal como está
      } catch (imageError) {
        console.error("Error procesando imagen:", imageError);
        return res.status(400).json({ 
          message: "Error al procesar la imagen. Verifique que sea un formato válido." 
        });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { ...dataToUpdate, updated_at: new Date() },
      { new: true, runValidators: true }
    ).populate('supplier_id').populate('gym_id');

    res.json({
      message: "Producto actualizado exitosamente",
      product: updatedProduct
    });
  } catch (err) {
    console.error("Error actualizando producto:", err);
    res.status(500).json({ message: "Error interno del servidor", error: err.message });
  }
};

// ✅ Eliminar producto (solo admin) - MEJORADO con validación de ventas
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.body;
    const gym_id = req.user.gym_id;

    if (!id) {
      return res.status(400).json({ message: "ID del producto requerido" });
    }

    // Buscar el producto primero
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Verificar que el producto pertenezca al mismo gimnasio
    if (existingProduct.gym_id.toString() !== gym_id.toString()) {
      return res.status(403).json({ 
        message: "No tienes permiso para eliminar este producto" 
      });
    }

    // 🔥 NUEVA VALIDACIÓN: Verificar si el producto tiene ventas registradas
    const existingSales = await ProductSale.findOne({ 
      product_id: id,
      gym_id: gym_id
    });

    if (existingSales) {
      return res.status(400).json({ 
        message: "No se puede eliminar el producto porque tiene ventas registradas en el historial. Para mantener la integridad de los datos, los productos con ventas no pueden ser eliminados.",
        details: "Si deseas ocultar este producto, puedes cambiar su estado a 'inactivo' en lugar de eliminarlo."
      });
    }

    // Si no hay ventas, proceder con la eliminación
    await Product.findByIdAndDelete(id);

    res.json({ 
      message: "Producto eliminado exitosamente",
      deletedProduct: existingProduct
    });
  } catch (err) {
    console.error("Error eliminando producto:", err);
    res.status(500).json({ message: "Error interno del servidor", error: err.message });
  }
};

// ✅ Vender producto (admin y colaborador)
export const sellProduct = async (req, res) => {
  try {
    const { id, quantity_sold, sale_price } = req.body;
    const { id: user_id, role } = req.user;
    const gym_id = req.user.gym_id;

    if (!id || !quantity_sold) {
      return res.status(400).json({ 
        message: "ID del producto y cantidad vendida son requeridos" 
      });
    }

    if (quantity_sold <= 0) {
      return res.status(400).json({ 
        message: "La cantidad vendida debe ser mayor a 0" 
      });
    }

    // Buscar el producto
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Verificar que el producto pertenezca al mismo gimnasio
    if (product.gym_id.toString() !== gym_id.toString()) {
      return res.status(403).json({ 
        message: "No tienes permiso para vender este producto" 
      });
    }

    // Verificar que hay suficiente stock
    if (product.stock.quantity < quantity_sold) {
      return res.status(400).json({ 
        message: `Stock insuficiente. Stock disponible: ${product.stock.quantity} ${product.stock.unit}` 
      });
    }

    // Actualizar el stock y registrar quien hizo la venta
    const newQuantity = product.stock.quantity - quantity_sold;
    const newStatus = newQuantity === 0 ? 'out_of_stock' : product.status;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { 
        'stock.quantity': newQuantity,
        status: newStatus,
        updated_by_id: user_id,
        updated_by_type: role,
        updated_at: new Date()
      },
      { new: true }
    ).populate('supplier_id').populate('gym_id');

    // Información de la venta
    const saleInfo = {
      product_id: id,
      product_name: product.name_product,
      quantity_sold,
      unit: product.stock.unit,
      original_price: product.price.amount,
      sale_price: sale_price || product.price.amount,
      currency: product.price.currency,
      total_amount: (sale_price || product.price.amount) * quantity_sold,
      remaining_stock: newQuantity,
      sale_date: new Date(),
      sold_by: user_id,
      sold_by_type: role,
      gym_id
    };

    res.json({
      message: "Venta registrada exitosamente",
      sale: saleInfo,
      updated_product: updatedProduct
    });
  } catch (err) {
    console.error("Error procesando venta:", err);
    res.status(500).json({ message: "Error interno del servidor", error: err.message });
  }
};