// controllers/supplier.controller.js
import Supplier from "../models/Supplier.js";
import Admin from "../models/Admin.js";
import Colaborator from "../models/Colaborator.js";
import Product from "../models/Product.js";

// GET /suppliers/all
export const getAllSuppliers = async (req, res) => {
  try {
    const gym_id = req.user.gym_id;

    if (!gym_id) {
      return res.status(400).json({ message: "El usuario no tiene un gimnasio asignado." });
    }

    const suppliers = await Supplier.find({ gym_id }).sort({ createdAt: -1 });

    // Mapear información adicional de auditoría
    const suppliersWithAuditInfo = await Promise.all(
      suppliers.map(async (supplier) => {
        try {
          const supplierObj = supplier.toObject();

          // Buscar información de quien registró
          if (supplierObj.registered_by_id && supplierObj.registered_by_type) {
            let registeredByInfo = null;

            if (supplierObj.registered_by_type === "Administrador") {
              registeredByInfo = await Admin.findById(supplierObj.registered_by_id, "name last_name");
            } else if (supplierObj.registered_by_type === "Colaborador") {
              registeredByInfo = await Colaborator.findById(supplierObj.registered_by_id, "name last_name");
            }

            if (registeredByInfo) {
              supplierObj.registered_by_name = `${registeredByInfo.name || ""} ${
                registeredByInfo.last_name || ""
              }`.trim();
            }
          }

          // Buscar información de quien actualizó (si existe)
          if (supplierObj.updated_by_id && supplierObj.updated_by_type) {
            let updatedByInfo = null;

            if (supplierObj.updated_by_type === "Administrador") {
              updatedByInfo = await Admin.findById(supplierObj.updated_by_id, "name last_name");
            } else if (supplierObj.updated_by_type === "Colaborador") {
              updatedByInfo = await Colaborator.findById(supplierObj.updated_by_id, "name last_name");
            }

            if (updatedByInfo) {
              supplierObj.updated_by_name = `${updatedByInfo.name || ""} ${updatedByInfo.last_name || ""}`.trim();
            }
          }

          return supplierObj;
        } catch (error) {
          console.error("Error procesando proveedor:", supplier._id, error);
          return supplier.toObject();
        }
      })
    );

    res.json({
      message: "Proveedores obtenidos exitosamente",
      count: suppliersWithAuditInfo.length,
      suppliers: suppliersWithAuditInfo,
    });
  } catch (err) {
    console.error("Error en getAllSuppliers:", err);
    res.status(500).json({ message: "Error al obtener proveedores", error: err.message });
  }
};

// GET /suppliers/:id
export const getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;
    const gym_id = req.user.gym_id;

    if (!gym_id) {
      return res.status(400).json({ message: "El usuario no tiene un gimnasio asignado." });
    }

    const supplier = await Supplier.findOne({ _id: id, gym_id });

    if (!supplier) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    // Agregar información de auditoría
    const supplierObj = supplier.toObject();

    // Buscar información de quien registró
    if (supplierObj.registered_by_id && supplierObj.registered_by_type) {
      let registeredByInfo = null;

      if (supplierObj.registered_by_type === "Administrador") {
        registeredByInfo = await Admin.findById(supplierObj.registered_by_id, "name last_name");
      } else if (supplierObj.registered_by_type === "Colaborador") {
        registeredByInfo = await Colaborator.findById(supplierObj.registered_by_id, "name last_name");
      }

      if (registeredByInfo) {
        supplierObj.registered_by_name = `${registeredByInfo.name || ""} ${registeredByInfo.last_name || ""}`.trim();
      }
    }

    // Buscar información de quien actualizó (si existe)
    if (supplierObj.updated_by_id && supplierObj.updated_by_type) {
      let updatedByInfo = null;

      if (supplierObj.updated_by_type === "Administrador") {
        updatedByInfo = await Admin.findById(supplierObj.updated_by_id, "name last_name");
      } else if (supplierObj.updated_by_type === "Colaborador") {
        updatedByInfo = await Colaborator.findById(supplierObj.updated_by_id, "name last_name");
      }

      if (updatedByInfo) {
        supplierObj.updated_by_name = `${updatedByInfo.name || ""} ${updatedByInfo.last_name || ""}`.trim();
      }
    }

    res.json({
      message: "Proveedor obtenido exitosamente",
      supplier: supplierObj,
    });
  } catch (err) {
    console.error("Error en getSupplierById:", err);
    res.status(500).json({ message: "Error al obtener proveedor", error: err.message });
  }
};

// POST /suppliers/create
export const createSupplier = async (req, res) => {
  try {
    const { id: user_id, role } = req.user;
    const { name, phone, email } = req.body;
    const gym_id = req.user.gym_id;

    if (!gym_id) {
      return res.status(400).json({ message: "El usuario no tiene un gimnasio asignado." });
    }

    // Validaciones básicas
    if (!name) {
      return res.status(400).json({
        message: "El nombre del proveedor es requerido",
      });
    }

    // Verificar si ya existe un proveedor con el mismo email en el mismo gym (si se proporciona email)
    if (email && email.trim() !== "") {
      const existingSupplier = await Supplier.findOne({
        email: email.toLowerCase().trim(),
        gym_id,
      });

      if (existingSupplier) {
        return res.status(400).json({
          message: "Ya existe un proveedor con este email en tu gimnasio",
        });
      }
    }

    const newSupplier = new Supplier({
      name: name.trim(),
      phone: phone ? phone.trim() : "",
      email: email ? email.toLowerCase().trim() : "",
      gym_id,
      registered_by_id: user_id,
      registered_by_type: role,
    });

    const saved = await newSupplier.save();

    res.status(201).json({
      message: "Proveedor creado exitosamente",
      supplier: saved,
    });
  } catch (err) {
    console.error("Error creando proveedor:", err);
    res.status(400).json({ message: "Error al crear proveedor", error: err.message });
  }
};

// POST /suppliers/update
export const updateSupplier = async (req, res) => {
  try {
    const { id, ...dataToUpdate } = req.body;
    const { id: user_id, role } = req.user;
    const gym_id = req.user.gym_id;

    if (!id) {
      return res.status(400).json({ message: "ID del proveedor requerido" });
    }

    // Registrar usuario que actualiza
    dataToUpdate.updated_by_id = user_id;
    dataToUpdate.updated_by_type = role;

    // Limpiar datos de entrada
    if (dataToUpdate.name) {
      dataToUpdate.name = dataToUpdate.name.trim();
    }
    if (dataToUpdate.phone) {
      dataToUpdate.phone = dataToUpdate.phone.trim();
    }
    if (dataToUpdate.email) {
      dataToUpdate.email = dataToUpdate.email.toLowerCase().trim();
    }

    // Buscar el proveedor primero
    const existingSupplier = await Supplier.findOne({ _id: id, gym_id });
    if (!existingSupplier) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    // Si se actualiza el email, verificar que no exista otro proveedor con el mismo email
    if (dataToUpdate.email && dataToUpdate.email !== existingSupplier.email && dataToUpdate.email.trim() !== "") {
      const duplicateSupplier = await Supplier.findOne({
        email: dataToUpdate.email,
        gym_id,
        _id: { $ne: id },
      });
      if (duplicateSupplier) {
        return res.status(400).json({
          message: "Ya existe otro proveedor con este email en tu gimnasio.",
        });
      }
    }

    const updated = await Supplier.findOneAndUpdate({ _id: id, gym_id }, dataToUpdate, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Proveedor no encontrado al actualizar" });
    }

    res.json({
      message: "Proveedor actualizado exitosamente",
      supplier: updated,
    });
  } catch (err) {
    console.error("Error actualizando proveedor:", err);
    res.status(400).json({ message: "Error al actualizar proveedor", error: err.message });
  }
};

// POST /suppliers/delete
export const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.body;
    const gym_id = req.user.gym_id;

    if (!id) {
      return res.status(400).json({ message: "ID del proveedor requerido" });
    }

    // Buscar el proveedor primero
    const existingSupplier = await Supplier.findOne({ _id: id, gym_id });
    if (!existingSupplier) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    const hasProducts = await Product.findOne({ supplier_id: id });
    if (hasProducts) {
      return res.status(400).json({
        message: "No se puede eliminar el proveedor porque tiene productos asociados",
      });
    }

    await Supplier.findOneAndDelete({ _id: id, gym_id });

    res.json({
      message: "Proveedor eliminado correctamente",
      deletedSupplier: existingSupplier,
    });
  } catch (err) {
    console.error("Error eliminando proveedor:", err);
    res.status(500).json({ message: "Error al eliminar proveedor", error: err.message });
  }
};
