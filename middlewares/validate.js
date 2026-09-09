const { ZodError } = require('zod');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const target = req[source];
    const result = schema.safeParse(target);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'request',
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        data: null,
        message: 'Validation failed',
        errors,
      });
    }

    req[source] = result.data;
    return next();
  };
}

module.exports = validate;
