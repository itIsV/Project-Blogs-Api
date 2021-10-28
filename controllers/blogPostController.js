const blogPostService = require('../services/blogPostService');

const status = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  SERVER_ERROR: 500,
};

const addBlogPost = async (req, res) => {
  const { headers: { authorization: token },
    body: { title, content, categoryIds } } = req;
  
    const blogPost = await blogPostService.addBlogPost(token, title, content, categoryIds);
  
  if (blogPost.err) {
    return res.status(status[blogPost.code]).json(blogPost.err);
  }

  return res.status(status.CREATED).json(blogPost);
};

const getAllBlogPost = async (req, res) => {
  const { headers: { authorization: token } } = req;
  
    const AllBlogPost = await blogPostService.getAllBlogPost(token);
  
  if (AllBlogPost.err) {
    return res.status(status[AllBlogPost.code]).json(AllBlogPost.err);
  }

  return res.status(status.OK).json(AllBlogPost);
};

const getBlogPostByID = async (req, res) => {
  const { headers: { authorization: token }, params: { id } } = req;
  
    const BlogPost = await blogPostService.getBlogPostByID(token, id);
  
    if (!BlogPost) {
      return res.status(status.NOT_FOUND).json({
        message: 'Post does not exist',
      });
    }
    
    if (BlogPost.err) {
      return res.status(status[BlogPost.code]).json(BlogPost.err);
  }

  return res.status(status.OK).json(BlogPost);
};

module.exports = {
  addBlogPost,
  getAllBlogPost,
  getBlogPostByID,
};
