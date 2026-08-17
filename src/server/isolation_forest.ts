/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SecurityEvent } from "../types.js";

interface StandardScalerParams {
  means: number[];
  stdevs: number[];
}

export class StandardScaler {
  private params: StandardScalerParams | null = null;

  public fit(data: number[][]): void {
    if (data.length === 0) return;
    const numFeatures = data[0].length;
    const means: number[] = new Array(numFeatures).fill(0);
    const stdevs: number[] = new Array(numFeatures).fill(0);

    // Calculate means
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < numFeatures; j++) {
        means[j] += data[i][j];
      }
    }
    for (let j = 0; j < numFeatures; j++) {
      means[j] /= data.length;
    }

    // Calculate standard deviations
    for (let i = 0; i < data.length; i++) {
      for (let j = 0; j < numFeatures; j++) {
        const diff = data[i][j] - means[j];
        stdevs[j] += diff * diff;
      }
    }
    for (let j = 0; j < numFeatures; j++) {
      stdevs[j] = Math.sqrt(stdevs[j] / data.length);
      // Avoid division by zero
      if (stdevs[j] === 0) stdevs[j] = 1;
    }

    this.params = { means, stdevs };
  }

  public transform(data: number[][]): number[][] {
    if (!this.params) throw new Error("StandardScaler has not been fitted.");
    const { means, stdevs } = this.params;
    return data.map((row) =>
      row.map((val, j) => (val - means[j]) / stdevs[j])
    );
  }

  public transformRow(row: number[]): number[] {
    if (!this.params) throw new Error("StandardScaler has not been fitted.");
    const { means, stdevs } = this.params;
    return row.map((val, j) => (val - means[j]) / stdevs[j]);
  }
}

interface IsolationTreeNode {
  featureIdx: number;
  splitValue: number;
  left: IsolationTreeNode | null;
  right: IsolationTreeNode | null;
  size: number;
  isLeaf: boolean;
}

export class IsolationForest {
  private numTrees: number;
  private subSampleSize: number;
  private maxDepth: number;
  private trees: IsolationTreeNode[] = [];
  private scaler: StandardScaler;
  private isFitted: boolean = false;

  constructor(numTrees: number = 100, subSampleSize: number = 256) {
    this.numTrees = numTrees;
    this.subSampleSize = subSampleSize;
    this.maxDepth = Math.ceil(Math.log2(subSampleSize));
    this.scaler = new StandardScaler();
  }

  /**
   * Average path length in an isolation tree for n nodes.
   * Represented as c(n).
   */
  private static averagePathLength(n: number): number {
    if (n <= 1) return 0;
    if (n === 2) return 1;
    const eulerConstant = 0.5772156649;
    return 2 * (Math.log(n - 1) + eulerConstant) - (2 * (n - 1)) / n;
  }

  /**
   * Generates a random integer in [min, max] inclusive
   */
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Generates a random float in [min, max]
   */
  private randomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  /**
   * Recursive method to build an Isolation Tree (iTree)
   */
  private buildTree(X: number[][], currentDepth: number): IsolationTreeNode {
    const size = X.length;

    // Base condition for leaf node
    if (currentDepth >= this.maxDepth || size <= 1) {
      return {
        featureIdx: -1,
        splitValue: -1,
        left: null,
        right: null,
        size,
        isLeaf: true,
      };
    }

    const numFeatures = X[0].length;
    let featureIdx = -1;
    let minVal = Infinity;
    let maxVal = -Infinity;
    let attempts = 0;

    // Randomly select a feature that actually has non-constant values
    while (attempts < 10) {
      const idx = this.randomInt(0, numFeatures - 1);
      let min = Infinity;
      let max = -Infinity;
      for (let i = 0; i < size; i++) {
        const val = X[i][idx];
        if (val < min) min = val;
        if (val > max) max = val;
      }
      if (min < max) {
        featureIdx = idx;
        minVal = min;
        maxVal = max;
        break;
      }
      attempts++;
    }

    // If no splitting feature found, make leaf
    if (featureIdx === -1) {
      return {
        featureIdx: -1,
        splitValue: -1,
        left: null,
        right: null,
        size,
        isLeaf: true,
      };
    }

    // Select random split value uniformly in range [min, max]
    const splitValue = this.randomFloat(minVal, maxVal);

    const X_left: number[][] = [];
    const X_right: number[][] = [];
    for (let i = 0; i < size; i++) {
      if (X[i][featureIdx] < splitValue) {
        X_left.push(X[i]);
      } else {
        X_right.push(X[i]);
      }
    }

    return {
      featureIdx,
      splitValue,
      left: this.buildTree(X_left, currentDepth + 1),
      right: this.buildTree(X_right, currentDepth + 1),
      size,
      isLeaf: false,
    };
  }

  /**
   * Fits the Isolation Forest model on NORMAL (unsupervised) data.
   */
  public fit(X: number[][]): void {
    if (X.length === 0) {
      throw new Error("Cannot fit Isolation Forest on empty data.");
    }

    // 1. Fit StandardScaler and scale the training data
    this.scaler.fit(X);
    const scaledX = this.scaler.transform(X);

    this.trees = [];
    const n = scaledX.length;

    // 2. Build the forest of isolation trees
    for (let t = 0; t < this.numTrees; t++) {
      // Sub-sample data for this tree
      const sample: number[][] = [];
      const sampleSize = Math.min(this.subSampleSize, n);
      const chosenIndices = new Set<number>();

      while (chosenIndices.size < sampleSize) {
        const idx = this.randomInt(0, n - 1);
        chosenIndices.add(idx);
      }

      for (const idx of chosenIndices) {
        sample.push(scaledX[idx]);
      }

      this.trees.push(this.buildTree(sample, 0));
    }

    this.isFitted = true;
  }

  /**
   * Helper to calculate path length of a row in a specific tree
   */
  private pathLength(row: number[], node: IsolationTreeNode, depth: number): number {
    if (node.isLeaf) {
      return depth + IsolationForest.averagePathLength(node.size);
    }
    if (row[node.featureIdx] < node.splitValue) {
      return this.pathLength(row, node.left!, depth + 1);
    } else {
      return this.pathLength(row, node.right!, depth + 1);
    }
  }

  /**
   * Predicts the anomaly score s(x, n) for a single instance.
   * Returns a score in [0, 1].
   */
  public computeAnomalyScore(row: number[]): number {
    if (!this.isFitted) {
      // Fallback: if not fitted, return standard baseline
      return 0.5;
    }

    const scaledRow = this.scaler.transformRow(row);
    let totalPathLength = 0;

    for (const tree of this.trees) {
      totalPathLength += this.pathLength(scaledRow, tree, 0);
    }

    const meanPathLength = totalPathLength / this.trees.length;
    const n = Math.min(this.subSampleSize, this.trees[0]?.size || this.subSampleSize);
    const cN = IsolationForest.averagePathLength(n);

    if (cN === 0) return 0.5;

    // s(x, n) = 2 ^ (- (E(h(x)) / c(n)))
    return Math.pow(2, -(meanPathLength / cN));
  }

  /**
   * Helper to extract feature vectors from Enriched Security Events
   */
  public static extractFeatures(event: SecurityEvent): number[] {
    return [
      event.bytes_per_second,
      event.session_duration,
      event.is_off_hours ? 1 : 0,
      event.ip_reputation_flag ? 1 : 0,
      event.abnormal_port_flag ? 1 : 0,
      event.session_abnormal ? 1 : 0,
    ];
  }
}
