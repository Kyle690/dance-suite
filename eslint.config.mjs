import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

const eslintConfig = [
    ...compat.extends("next/core-web-vitals", "next/typescript"),
    {
        ignores: [
            "node_modules/**",
            ".next/**",
            "out/**",
            "build/**",
            "next-env.d.ts",
        ],
        "rules": {
            "@next/next/link-passhref": "off",
            "react/no-unescaped-entities": "off",
            "react/jsx-closing-tag-location": "error",
            "react/jsx-first-prop-new-line": [ "error", "multiline-multiprop" ],
            "no-console":"off",
            "react/jsx-indent":[
                "error",
                4
            ],
            "react/jsx-indent-props":[
                "error",
                4
            ],
            "indent": [ "error", 4 ],
            "array-bracket-spacing": [
                "error",
                "always"
            ],
            "object-curly-spacing": [
                "error",
                "always"
            ],
            "react/jsx-filename-extension":[
                1,
                {
                    "extensions":[
                        ".js",
                        ".jsx",
                        ".ts",
                        ".tsx"
                    ]
                }
            ],
            "no-unsafe-optional-chaining":0,
            "jsx-a11y/click-events-have-key-events":"off",
            "jsx-a11y/no-static-element-interactions":"off",
            "react-hooks/exhaustive-deps":"off",
            "react/function-component-definition":[
                2,
                {
                    "namedComponents":"arrow-function"
                }
            ],
            "react/prop-types":[
                "off"
            ],
            "react/jsx-max-props-per-line": [ 1, { "maximum": 2, "when": "always" } ],
            "react/require-default-props":"off",
            "react/forbid-prop-types":[
                "error",
                {
                    "ignore":[
                        "navigation",
                        "restProps",
                        "touchProps",
                        "textProps"
                    ]
                }
            ],
            "react/jsx-closing-bracket-location": [ "error", "line-aligned" ],
            "import/no-anonymous-default-export": "off",
            "@typescript-eslint/no-explicit-any":"off"
        }
    },
];

export default eslintConfig;
