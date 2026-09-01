const ts = require('typescript');

// Nx calls before(pluginOptions, program) and expects a TransformerFactory back.
// See @nx/js/src/utils/typescript/load-ts-transformers.ts.
exports.before = function before(_pluginOptions, _program) {
  return (ctx) => (sourceFile) => {
    const visit = (node) => {
      if (ts.isStringLiteral(node) && node.text === 'TRANSFORMER_DID_NOT_RUN') {
        return ctx.factory.createStringLiteral('TRANSFORMER_RAN');
      }
      return ts.visitEachChild(node, visit, ctx);
    };
    return ts.visitNode(sourceFile, visit);
  };
};
