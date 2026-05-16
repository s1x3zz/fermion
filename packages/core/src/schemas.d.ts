import { z } from 'zod';
export declare const CircuitNodeSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    position: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
}, "strip", z.ZodTypeAny, {
    id: string;
    label: string;
    position: [number, number, number];
}, {
    id: string;
    label: string;
    position: [number, number, number];
}>;
export declare const CircuitEdgeSchema: z.ZodObject<{
    id: z.ZodString;
    from: z.ZodString;
    to: z.ZodString;
    componentType: z.ZodString;
    value: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    value: number;
    from: string;
    to: string;
    componentType: string;
}, {
    id: string;
    value: number;
    from: string;
    to: string;
    componentType: string;
}>;
export declare const CircuitGraphSchema: z.ZodObject<{
    nodes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        position: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        label: string;
        position: [number, number, number];
    }, {
        id: string;
        label: string;
        position: [number, number, number];
    }>, "many">;
    edges: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        from: z.ZodString;
        to: z.ZodString;
        componentType: z.ZodString;
        value: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        value: number;
        from: string;
        to: string;
        componentType: string;
    }, {
        id: string;
        value: number;
        from: string;
        to: string;
        componentType: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    nodes: {
        id: string;
        label: string;
        position: [number, number, number];
    }[];
    edges: {
        id: string;
        value: number;
        from: string;
        to: string;
        componentType: string;
    }[];
}, {
    nodes: {
        id: string;
        label: string;
        position: [number, number, number];
    }[];
    edges: {
        id: string;
        value: number;
        from: string;
        to: string;
        componentType: string;
    }[];
}>;
export type CircuitNodeInput = z.input<typeof CircuitNodeSchema>;
export type CircuitEdgeInput = z.input<typeof CircuitEdgeSchema>;
export declare const PlacedComponentSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    position: z.ZodObject<{
        row: z.ZodString;
        col: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        row: string;
        col: number;
    }, {
        row: string;
        col: number;
    }>;
    rotation: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<90>, z.ZodLiteral<180>, z.ZodLiteral<270>]>;
    label: z.ZodOptional<z.ZodString>;
    value: z.ZodOptional<z.ZodNumber>;
    properties: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    id: string;
    position: {
        row: string;
        col: number;
    };
    type: string;
    rotation: 0 | 90 | 180 | 270;
    properties: Record<string, unknown>;
    label?: string | undefined;
    value?: number | undefined;
}, {
    id: string;
    position: {
        row: string;
        col: number;
    };
    type: string;
    rotation: 0 | 90 | 180 | 270;
    properties: Record<string, unknown>;
    label?: string | undefined;
    value?: number | undefined;
}>;
export declare const PlacedWireSchema: z.ZodObject<{
    id: z.ZodString;
    pinA: z.ZodObject<{
        row: z.ZodString;
        col: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        row: string;
        col: number;
    }, {
        row: string;
        col: number;
    }>;
    pinB: z.ZodObject<{
        row: z.ZodString;
        col: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        row: string;
        col: number;
    }, {
        row: string;
        col: number;
    }>;
    signalType: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    pinA: {
        row: string;
        col: number;
    };
    pinB: {
        row: string;
        col: number;
    };
    signalType: string;
}, {
    id: string;
    pinA: {
        row: string;
        col: number;
    };
    pinB: {
        row: string;
        col: number;
    };
    signalType: string;
}>;
export declare const BreadboardCircuitSchema: z.ZodObject<{
    components: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        position: z.ZodObject<{
            row: z.ZodString;
            col: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            row: string;
            col: number;
        }, {
            row: string;
            col: number;
        }>;
        rotation: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<90>, z.ZodLiteral<180>, z.ZodLiteral<270>]>;
        label: z.ZodOptional<z.ZodString>;
        value: z.ZodOptional<z.ZodNumber>;
        properties: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        position: {
            row: string;
            col: number;
        };
        type: string;
        rotation: 0 | 90 | 180 | 270;
        properties: Record<string, unknown>;
        label?: string | undefined;
        value?: number | undefined;
    }, {
        id: string;
        position: {
            row: string;
            col: number;
        };
        type: string;
        rotation: 0 | 90 | 180 | 270;
        properties: Record<string, unknown>;
        label?: string | undefined;
        value?: number | undefined;
    }>, "many">;
    wires: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        pinA: z.ZodObject<{
            row: z.ZodString;
            col: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            row: string;
            col: number;
        }, {
            row: string;
            col: number;
        }>;
        pinB: z.ZodObject<{
            row: z.ZodString;
            col: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            row: string;
            col: number;
        }, {
            row: string;
            col: number;
        }>;
        signalType: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        pinA: {
            row: string;
            col: number;
        };
        pinB: {
            row: string;
            col: number;
        };
        signalType: string;
    }, {
        id: string;
        pinA: {
            row: string;
            col: number;
        };
        pinB: {
            row: string;
            col: number;
        };
        signalType: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    components: {
        id: string;
        position: {
            row: string;
            col: number;
        };
        type: string;
        rotation: 0 | 90 | 180 | 270;
        properties: Record<string, unknown>;
        label?: string | undefined;
        value?: number | undefined;
    }[];
    wires: {
        id: string;
        pinA: {
            row: string;
            col: number;
        };
        pinB: {
            row: string;
            col: number;
        };
        signalType: string;
    }[];
}, {
    components: {
        id: string;
        position: {
            row: string;
            col: number;
        };
        type: string;
        rotation: 0 | 90 | 180 | 270;
        properties: Record<string, unknown>;
        label?: string | undefined;
        value?: number | undefined;
    }[];
    wires: {
        id: string;
        pinA: {
            row: string;
            col: number;
        };
        pinB: {
            row: string;
            col: number;
        };
        signalType: string;
    }[];
}>;
export declare const CircuitSnapshotSchema: z.ZodObject<{
    version: z.ZodString;
    savedAt: z.ZodNumber;
    circuit: z.ZodObject<{
        components: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodString;
            position: z.ZodObject<{
                row: z.ZodString;
                col: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                row: string;
                col: number;
            }, {
                row: string;
                col: number;
            }>;
            rotation: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<90>, z.ZodLiteral<180>, z.ZodLiteral<270>]>;
            label: z.ZodOptional<z.ZodString>;
            value: z.ZodOptional<z.ZodNumber>;
            properties: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            position: {
                row: string;
                col: number;
            };
            type: string;
            rotation: 0 | 90 | 180 | 270;
            properties: Record<string, unknown>;
            label?: string | undefined;
            value?: number | undefined;
        }, {
            id: string;
            position: {
                row: string;
                col: number;
            };
            type: string;
            rotation: 0 | 90 | 180 | 270;
            properties: Record<string, unknown>;
            label?: string | undefined;
            value?: number | undefined;
        }>, "many">;
        wires: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            pinA: z.ZodObject<{
                row: z.ZodString;
                col: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                row: string;
                col: number;
            }, {
                row: string;
                col: number;
            }>;
            pinB: z.ZodObject<{
                row: z.ZodString;
                col: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                row: string;
                col: number;
            }, {
                row: string;
                col: number;
            }>;
            signalType: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            pinA: {
                row: string;
                col: number;
            };
            pinB: {
                row: string;
                col: number;
            };
            signalType: string;
        }, {
            id: string;
            pinA: {
                row: string;
                col: number;
            };
            pinB: {
                row: string;
                col: number;
            };
            signalType: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        components: {
            id: string;
            position: {
                row: string;
                col: number;
            };
            type: string;
            rotation: 0 | 90 | 180 | 270;
            properties: Record<string, unknown>;
            label?: string | undefined;
            value?: number | undefined;
        }[];
        wires: {
            id: string;
            pinA: {
                row: string;
                col: number;
            };
            pinB: {
                row: string;
                col: number;
            };
            signalType: string;
        }[];
    }, {
        components: {
            id: string;
            position: {
                row: string;
                col: number;
            };
            type: string;
            rotation: 0 | 90 | 180 | 270;
            properties: Record<string, unknown>;
            label?: string | undefined;
            value?: number | undefined;
        }[];
        wires: {
            id: string;
            pinA: {
                row: string;
                col: number;
            };
            pinB: {
                row: string;
                col: number;
            };
            signalType: string;
        }[];
    }>;
    metadata: z.ZodObject<{
        componentCount: z.ZodNumber;
        wireCount: z.ZodNumber;
        simulatorVersion: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        componentCount: number;
        wireCount: number;
        simulatorVersion: string;
    }, {
        componentCount: number;
        wireCount: number;
        simulatorVersion: string;
    }>;
}, "strip", z.ZodTypeAny, {
    circuit: {
        components: {
            id: string;
            position: {
                row: string;
                col: number;
            };
            type: string;
            rotation: 0 | 90 | 180 | 270;
            properties: Record<string, unknown>;
            label?: string | undefined;
            value?: number | undefined;
        }[];
        wires: {
            id: string;
            pinA: {
                row: string;
                col: number;
            };
            pinB: {
                row: string;
                col: number;
            };
            signalType: string;
        }[];
    };
    metadata: {
        componentCount: number;
        wireCount: number;
        simulatorVersion: string;
    };
    version: string;
    savedAt: number;
}, {
    circuit: {
        components: {
            id: string;
            position: {
                row: string;
                col: number;
            };
            type: string;
            rotation: 0 | 90 | 180 | 270;
            properties: Record<string, unknown>;
            label?: string | undefined;
            value?: number | undefined;
        }[];
        wires: {
            id: string;
            pinA: {
                row: string;
                col: number;
            };
            pinB: {
                row: string;
                col: number;
            };
            signalType: string;
        }[];
    };
    metadata: {
        componentCount: number;
        wireCount: number;
        simulatorVersion: string;
    };
    version: string;
    savedAt: number;
}>;
export declare const FermionProjectSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodNumber;
    updatedAt: z.ZodNumber;
    thumbnail: z.ZodOptional<z.ZodString>;
    circuit: z.ZodObject<{
        components: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodString;
            position: z.ZodObject<{
                row: z.ZodString;
                col: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                row: string;
                col: number;
            }, {
                row: string;
                col: number;
            }>;
            rotation: z.ZodUnion<[z.ZodLiteral<0>, z.ZodLiteral<90>, z.ZodLiteral<180>, z.ZodLiteral<270>]>;
            label: z.ZodOptional<z.ZodString>;
            value: z.ZodOptional<z.ZodNumber>;
            properties: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            position: {
                row: string;
                col: number;
            };
            type: string;
            rotation: 0 | 90 | 180 | 270;
            properties: Record<string, unknown>;
            label?: string | undefined;
            value?: number | undefined;
        }, {
            id: string;
            position: {
                row: string;
                col: number;
            };
            type: string;
            rotation: 0 | 90 | 180 | 270;
            properties: Record<string, unknown>;
            label?: string | undefined;
            value?: number | undefined;
        }>, "many">;
        wires: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            pinA: z.ZodObject<{
                row: z.ZodString;
                col: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                row: string;
                col: number;
            }, {
                row: string;
                col: number;
            }>;
            pinB: z.ZodObject<{
                row: z.ZodString;
                col: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                row: string;
                col: number;
            }, {
                row: string;
                col: number;
            }>;
            signalType: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
            pinA: {
                row: string;
                col: number;
            };
            pinB: {
                row: string;
                col: number;
            };
            signalType: string;
        }, {
            id: string;
            pinA: {
                row: string;
                col: number;
            };
            pinB: {
                row: string;
                col: number;
            };
            signalType: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        components: {
            id: string;
            position: {
                row: string;
                col: number;
            };
            type: string;
            rotation: 0 | 90 | 180 | 270;
            properties: Record<string, unknown>;
            label?: string | undefined;
            value?: number | undefined;
        }[];
        wires: {
            id: string;
            pinA: {
                row: string;
                col: number;
            };
            pinB: {
                row: string;
                col: number;
            };
            signalType: string;
        }[];
    }, {
        components: {
            id: string;
            position: {
                row: string;
                col: number;
            };
            type: string;
            rotation: 0 | 90 | 180 | 270;
            properties: Record<string, unknown>;
            label?: string | undefined;
            value?: number | undefined;
        }[];
        wires: {
            id: string;
            pinA: {
                row: string;
                col: number;
            };
            pinB: {
                row: string;
                col: number;
            };
            signalType: string;
        }[];
    }>;
    metadata: z.ZodObject<{
        componentCount: z.ZodNumber;
        wireCount: z.ZodNumber;
        simulatorVersion: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        componentCount: number;
        wireCount: number;
        simulatorVersion: string;
    }, {
        componentCount: number;
        wireCount: number;
        simulatorVersion: string;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    circuit: {
        components: {
            id: string;
            position: {
                row: string;
                col: number;
            };
            type: string;
            rotation: 0 | 90 | 180 | 270;
            properties: Record<string, unknown>;
            label?: string | undefined;
            value?: number | undefined;
        }[];
        wires: {
            id: string;
            pinA: {
                row: string;
                col: number;
            };
            pinB: {
                row: string;
                col: number;
            };
            signalType: string;
        }[];
    };
    metadata: {
        componentCount: number;
        wireCount: number;
        simulatorVersion: string;
    };
    createdAt: number;
    updatedAt: number;
    description?: string | undefined;
    thumbnail?: string | undefined;
}, {
    id: string;
    name: string;
    circuit: {
        components: {
            id: string;
            position: {
                row: string;
                col: number;
            };
            type: string;
            rotation: 0 | 90 | 180 | 270;
            properties: Record<string, unknown>;
            label?: string | undefined;
            value?: number | undefined;
        }[];
        wires: {
            id: string;
            pinA: {
                row: string;
                col: number;
            };
            pinB: {
                row: string;
                col: number;
            };
            signalType: string;
        }[];
    };
    metadata: {
        componentCount: number;
        wireCount: number;
        simulatorVersion: string;
    };
    createdAt: number;
    updatedAt: number;
    description?: string | undefined;
    thumbnail?: string | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map