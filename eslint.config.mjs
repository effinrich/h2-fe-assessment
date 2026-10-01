import nx from "@nx/eslint-plugin";

// oxlint handles the general rule set (see .oxlintrc.json). This config exists
// for ONE rule: @nx/enforce-module-boundaries is an ESLint plugin, and oxlint is
// Rust-native with no custom-JS-plugin loading, so boundaries cannot move there.
export default [
    ...nx.configs["flat/base"],
    ...nx.configs["flat/typescript"],
    ...nx.configs["flat/javascript"],
    {
      "ignores": [
        "**/dist",
        "**/out-tsc",
        "**/styled-system",
        "**/vite.config.*.timestamp*",
        "**/vitest.config.*.timestamp*"
      ]
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.js",
            "**/*.jsx"
        ],
        rules: {
            "@nx/enforce-module-boundaries": [
                "error",
                {
                    enforceBuildableLibDependency: true,
                    allow: [
                        "^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$"
                    ],
                    depConstraints: [
                        // Layer rules: an app composes features; a feature
                        // composes ui and util; ui and util stay leaf-ward.
                        { sourceTag: "type:app",     onlyDependOnLibsWithTags: ["type:feature", "type:ui", "type:util"] },
                        { sourceTag: "type:feature", onlyDependOnLibsWithTags: ["type:ui", "type:util"] },
                        { sourceTag: "type:ui",      onlyDependOnLibsWithTags: ["type:ui", "type:util"] },
                        { sourceTag: "type:util",    onlyDependOnLibsWithTags: ["type:util"] },
                        // Scope rules: shared code may not reach into a scope.
                        { sourceTag: "scope:web",    onlyDependOnLibsWithTags: ["scope:web", "scope:shared"] },
                        { sourceTag: "scope:shared", onlyDependOnLibsWithTags: ["scope:shared"] },
                    ]
                }
            ]
        }
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.cts",
            "**/*.mts",
            "**/*.js",
            "**/*.jsx",
            "**/*.cjs",
            "**/*.mjs"
        ],
        rules: {}
    }
];
