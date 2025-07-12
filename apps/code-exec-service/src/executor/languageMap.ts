// Interface for the language map
export interface languageConfig {
  image: string;
  extension: string;
  compileCommand: string;
  runCommand: string;
}

// Language map configuration <string, languageConfig>
const languageMap: Record<string, languageConfig> = {
  cpp: {
    image: "gcc:latest",
    extension: "cpp",
    compileCommand: "g++ /workspace/src/Main.cpp -o /workspace/a.out",
    runCommand: "/workspace/a.out",
  },
  python: {
    image: "python:3.11-alpine",
    extension: "py",
    compileCommand: "",
    runCommand: "python3 /workspace/Main.py",
  },
  java: {
    image: "openjdk:17-alpine",
    extension: "java",
    compileCommand: "javac /workspace/Main.java",
    runCommand: "java -cp /workspace Main",
  },
};


export default languageMap;