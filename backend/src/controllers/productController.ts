import { Request, Response, NextFunction } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteImageFileIfExclusive,
  ImageCleanupStatus,
} from '../services/productService.js';

export const getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await getProducts();
    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);
    if (!product) {
      res.status(404).json({
        success: false,
        message: 'Product not found',
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const createProductHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, slug, categoryId, price, description, image, images } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, message: 'Product name is required' });
      return;
    }
    if (slug !== undefined && (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
      res.status(400).json({ success: false, message: 'Slug must be lowercase alphanumeric with hyphens' });
      return;
    }
    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      res.status(400).json({ success: false, message: 'Valid positive price is required' });
      return;
    }

    const imageList: string[] = Array.isArray(images) ? images : [];
    if (image && typeof image === 'string') {
      imageList.unshift(image);
    }

    const newProduct = await createProduct({
      name,
      ...(slug !== undefined ? { slug } : {}),
      price: Number(price),
      categoryId,
      description,
      images: imageList,
    });

    res.status(201).json({
      success: true,
      data: newProduct,
      message: 'Product created successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'SLUG_CONFLICT') {
      res.status(409).json({ success: false, message: 'Product slug is already in use' });
      return;
    }
    next(error);
  }
};

export const updateProductHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, categoryId, price, description, image, images } = req.body;

    const payload: Record<string, string | number | string[]> = {};
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ success: false, message: 'Product name cannot be empty' });
        return;
      }
      payload.name = name;
    }
    if (slug !== undefined) {
      if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        res.status(400).json({ success: false, message: 'Slug must be lowercase alphanumeric with hyphens' });
        return;
      }
      payload.slug = slug;
    }
    if (price !== undefined) {
      if (isNaN(Number(price)) || Number(price) < 0) {
        res.status(400).json({ success: false, message: 'Valid positive price is required' });
        return;
      }
      payload.price = Number(price);
    }
    if (categoryId !== undefined) payload.categoryId = categoryId;
    if (description !== undefined) payload.description = description;
    
    if (images !== undefined && Array.isArray(images)) {
      payload.images = images;
    } else if (image !== undefined && typeof image === 'string') {
      payload.images = [image];
    }

    // Capture the current image BEFORE updating so the replaced file can be
    // cleaned up only after the database update succeeds.
    const existing = await getProductById(id);
    if (!existing) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    const oldImageUrl = (existing.images || [])[0];

    const updated = await updateProduct(id, payload);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Replacement flow: the new image is already live in the database.
    // Delete the OLD file now — never before — and only when no other
    // product references it.
    let imageCleanup: ImageCleanupStatus = 'no-image';
    const newImageUrl = (updated.images || [])[0];
    if (oldImageUrl && oldImageUrl !== newImageUrl) {
      imageCleanup = await deleteImageFileIfExclusive(oldImageUrl, id);
    }

    res.status(200).json({
      success: true,
      data: updated,
      message:
        imageCleanup === 'failed'
          ? 'Product updated successfully, but the old image file could not be removed from storage.'
          : 'Product updated successfully',
      imageCleanup,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'SLUG_CONFLICT') {
      res.status(409).json({ success: false, message: 'Product slug is already in use' });
      return;
    }
    next(error);
  }
};

export const deleteProductHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    const { imageCleanup } = await deleteProduct(id);
    res.status(200).json({
      success: true,
      message:
        imageCleanup === 'failed'
          ? 'Product deleted successfully, but its image file could not be removed from storage.'
          : 'Product deleted successfully',
      imageCleanup,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getAllProducts,
  getSingleProduct,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
};
