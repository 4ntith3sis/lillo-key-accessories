import { Request, Response, NextFunction } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/categoryService.js';

export const getAllCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await getCategories();
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const getSingleCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await getCategoryById(id);
    if (!category) {
      res.status(404).json({
        success: false,
        message: 'Category not found',
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategoryHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, slug, description } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ success: false, message: 'Category name is required' });
      return;
    }
    if (slug !== undefined && (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
      res.status(400).json({ success: false, message: 'Slug must be lowercase alphanumeric with hyphens' });
      return;
    }

    const newCategory = await createCategory({ name, slug, description });
    res.status(201).json({
      success: true,
      data: newCategory,
      message: 'Category created successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'SLUG_CONFLICT') {
      res.status(409).json({ success: false, message: 'Category slug is already in use' });
      return;
    }
    next(error);
  }
};

export const updateCategoryHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, description } = req.body;

    if (name !== undefined && (!name || typeof name !== 'string' || !name.trim())) {
      res.status(400).json({ success: false, message: 'Category name cannot be empty' });
      return;
    }
    if (slug !== undefined && (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
      res.status(400).json({ success: false, message: 'Slug must be lowercase alphanumeric with hyphens' });
      return;
    }

    const updated = await updateCategory(id, { name, slug, description });
    if (!updated) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Category updated successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'SLUG_CONFLICT') {
      res.status(409).json({ success: false, message: 'Category slug is already in use' });
      return;
    }
    next(error);
  }
};

export const deleteCategoryHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const category = await getCategoryById(id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    await deleteCategory(id);
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error: any) {
    if (error?.message && error.message.includes('USED BY PRODUCTS')) {
      res.status(400).json({
        success: false,
        message: 'Category is still used by products.',
      });
      return;
    }
    next(error);
  }
};

export default {
  getAllCategories,
  getSingleCategory,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
};
