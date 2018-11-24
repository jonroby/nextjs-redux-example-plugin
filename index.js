const { transform } = require('babel-core');
const jsx = require("babel-plugin-syntax-jsx");
const classProperties = require("babel-plugin-syntax-class-properties");
const recast = require('recast');
const constantCase = require('constant-case');

const mods = require('./mods');
const defaults = require('./defaults');

const lowerFirstLetter = w => w.charAt(0).toLowerCase() + w.slice(1)

const genFlags = data => ({
  "-a": [
    {
      filepath: `./store.js`,
      mod: "modStore",
      default: "d1"
    }
  ],
  "-c": [
    {
      filepath: `./components/${lowerFirstLetter(data.component || 'Counter')}.js`,
      mod: "modComponent",
      default: "d1"
    }
  ],
});

const config = {
  parser: (filestring, mod) => {
    const transformedFile = transform(filestring, {
      parserOpts: {
	parser: recast.parse,
      },
      generatorOpts: {
	 "generator": recast.print
      },
      plugins: [classProperties, jsx, mod]
    });

    return transformedFile && transformedFile.code;
  },
  commands: input => {
    const action = input.filter(i => {
      return !((i).match(/-[a-z]/))
	&& i === (lowerFirstLetter(i));
    });

    const component = input.filter(i => {
      return !((i).match(/-[a-z]/))
	&& i !== (lowerFirstLetter(i));
    });

    let flags = input.filter(i => {
      return (i).match(/-[a-z]/);
    });

    if (flags.length === 0 && component.length === 0) {
      throw new Error("No Component was provided. Please ensure Components\n are capitalized and actions are lower case. \n If you only want to add an \n action to the store, use the '-a' flag.")
    }

    if (flags.length === 0 && action.length === 0) {
      throw new Error("No action was provided. Please ensure Components\n are capitalized and actions are lower case. \n If you only want to add an \n action to the store, use the '-c' flag.")
    } 

    flags = ['-a', '-c'];

    const actionConstant = constantCase(action);

    const data = {
      action: action[0],
      actionConstants: [actionConstant],
      component: component[0],
      storePath: '../store'
    };

    // Rewrite
    const flagsMapping = genFlags(data);
    const tasks = flags.reduce((prev, curr) => {
      return prev.concat(flagsMapping[curr]);
    }, []);
    
    return tasks.map(task => ({ ...task, data }));
  }
};

module.exports = { defaults, config, mods };
