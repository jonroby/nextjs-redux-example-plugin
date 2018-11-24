const modComponent = d => babel => {
  const { types: t } = babel;
  
  return {
    name: "component mod",
    visitor: {
      ImportDeclaration(path) {
        if (path.node.source.value === "../store") {
	  path.node.specifiers.push(
            t.importSpecifier(t.identifier(d.action), t.identifier(d.action))
          );
        }
      },
      // FunctionDeclaration(path) {
      //   if (path.node.id.name === "mapStateToProps") {
      // 	  const objectProperty = t.objectProperty(
      //       t.identifier(d.action),
      //       t.identifier(d.action),
      //       false,
      //       true
      //     );
      //     const variableDeclaration = path.node.body.body.filter(n => n.type === "VariableDeclaration");
      //     const returnStatement = path.node.body.body.filter(n => n.type === "ReturnStatement");
         
      //     variableDeclaration[0].declarations[0].id.properties.push(objectProperty);
      //     returnStatement[0].argument.properties.push(objectProperty)
      //   }
      // }    
    }
  };
}

const modStore = d => babel => {
  const { types: t } = babel;
  
  return {
    name: "store mod",
    visitor: {
      ObjectExpression(path) {
        if (path.parent && path.parent.id && path.parent.id.name === 'actionTypes') {
          for (let i = 0; i < d.actionConstants.length; i++) {
            const op = t.objectProperty(
	      t.identifier(d.actionConstants[i]),
	      t.stringLiteral(d.actionConstants[i]) // 
	    );
            path.node.properties.push(op);
          }
        }
      },
      SwitchStatement(path) {
        for (let i = 0; i < d.actionConstants.length; i++) {
          const switchDefault = path.node.cases.pop();
          const switchSt = t.switchCase(
            t.identifier(`types.${d.actionConstants[i]}`),
            [t.expressionStatement(
              t.identifier('return state')
            )]
          );

          path.node.cases.push(switchSt);
          path.node.cases.push(switchDefault);
        }
      },
      Program(path) {
        const last = path.node.body.pop(path.node.body.length-1)
        const beg = path.node.body.slice(0, path.node.body.length-1);

        const actionCreator = t.variableDeclarator(
          t.identifier(d.action),
          t.arrowFunctionExpression(
            [],
              t.arrowFunctionExpression(
                [t.identifier('dispatch')],
                t.blockStatement([
                  t.returnStatement(
                    t.callExpression(
                      t.identifier('dispatch'),
                      [t.objectExpression([t.objectProperty(
                        t.identifier('type'),
                        t.identifier(`actionTypes.${d.actionConstants[0]}`),
                      )])]
                    )
                  )
                ])
              )
          )
        )
        
        const v = t.exportNamedDeclaration(
          t.variableDeclaration('const', [actionCreator]),
          []
        );
        
        path.node.body.push(v);
        path.node.body.push(last);
      },
    }
  };
}

module.exports = { modComponent, modStore };
