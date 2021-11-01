const jwt = require('jsonwebtoken');

const { getAllCategory } = require('./categoryService');

const { BlogPost, User, Category } = require('../models');

const secret = 'Nanii!!!';

const invalidTkn = 'Expired or invalid token';

const hasRequiredFields = (token, title, content, categoryIds) => {
  switch (true) {
    case !token: return { code: 'UNAUTHORIZED',
    err: { message: 'Token not found' } };

    case !title: return { code: 'BAD_REQUEST',
    err: { message: '"title" is required' } };

    case !content: return { code: 'BAD_REQUEST',
    err: { message: '"content" is required' } };

    case !categoryIds: return { code: 'BAD_REQUEST',
    err: { message: '"categoryIds" is required' } };

    default: return true;
  }
};

const addBlogPostValidations = async (token, title, content, categoryIds) => {
  const requiredFields = hasRequiredFields(token, title, content, categoryIds);

  const isValid = await requiredFields.err
  ? requiredFields
  : await getAllCategory(token)
    .then((categories) => categoryIds
      .every((categoryId) => categories
        .some(({ id }) => id === categoryId)))
    .catch((err) => {
      console.log(err.message);
      return { code: 'UNAUTHORIZED', err: { message: invalidTkn } };  
    });
  
  if (isValid === false) {
    return { code: 'BAD_REQUEST', err: { message: '"categoryIds" not found' } };
  }

  return isValid;
};

const addBlogPost = async (token, title, content, categoryIds) => {
  const isValid = await addBlogPostValidations(token, title, content, categoryIds);
  if (isValid.err) return isValid;
  try {
    const { dataValues } = await BlogPost.create({ title, content, categoryIds });
    
    return dataValues;
  } catch (err) {
    console.log(err.message);
    return { code: 'SERVER_ERROR', err: { message: 'Algo deu errado' } };
  }
};

const getAllBlogPost = async (token) => {
  if (!token) return { code: 'UNAUTHORIZED', err: { message: 'Token not found' } };
  try {
    await jwt.verify(token, secret);
    return BlogPost.findAll({
      include: [{ model: User, as: 'user' },
        { model: Category, as: 'categories', through: { attributes: [] } }],
    });
  } catch (err) {
    console.log(err.message);
    return { code: 'UNAUTHORIZED', err: { message: invalidTkn } };
  }
};

const getBlogPostByID = async (token, id) => {
  if (!token) return { code: 'UNAUTHORIZED', err: { message: 'Token not found' } };
  try {
    await jwt.verify(token, secret);
    return BlogPost.findOne({
      where: { id },
      include: [{ model: User, as: 'user' },
        { model: Category, as: 'categories', through: { attributes: [] } }],
    });
  } catch (err) {
    console.log(err.message);
    return { code: 'UNAUTHORIZED', err: { message: invalidTkn } };
  }
};

const editRequiredFields = (title, content) => {
  if (!title || !content) {
    const err = !title
      ? { code: 'BAD_REQUEST', err: { message: '"title" is required' } }
      : { code: 'BAD_REQUEST', err: { message: '"content" is required' } };
    return err;
  }
  return true;
};

const editBlogPostByIDValidations = async (token, userID, title, content) => {
  try {
    const hasTitleAndContent = editRequiredFields(title, content);
    if (hasTitleAndContent.err) return hasTitleAndContent;
    const { payload: { email } } = await jwt.verify(token, secret);

    const { dataValues: { id } } = await User.findOne({
      where: { email },
      attributes: ['id'],
    });
    
    const isValid = Number(id) === Number(userID)
      ? true
      : { code: 'UNAUTHORIZED', err: { message: 'Unauthorized user' } };

    return isValid;
  } catch (err) {
    console.log(err.message);
    return { code: 'UNAUTHORIZED', err: { message: invalidTkn } };
  }
};

const editBlogPostByID = async (token, id, title, content) => {
  if (!token) return { code: 'UNAUTHORIZED', err: { message: 'Token not found' } };
  
  const isValid = await editBlogPostByIDValidations(token, id, title, content);
  if (isValid.err) return isValid;
  
  try {
    await BlogPost.update({ title, content }, { where: { id } });
    return BlogPost.findOne({
      where: { id },
      attributes: { exclude: ['id', 'published', 'updated'] }, // source: https://www.codegrepper.com/code-examples/javascript/sequelize+exclude+attributes
      include: 
        { model: Category,
          as: 'categories',
          through: { attributes: [] } },
    }); 
  } catch (err) {
    console.log(err.message);
    return { code: 'UNAUTHORIZED', err: { message: invalidTkn } };
  }
};

module.exports = {
  addBlogPost,
  getAllBlogPost,
  getBlogPostByID,
  editBlogPostByID,
};
