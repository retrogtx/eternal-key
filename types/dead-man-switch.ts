import { Idl } from '@coral-xyz/anchor';

export type DeadManSwitchIDL = {
  version: "0.1.0";
  name: "dead_man_switch";
  instructions: [
    {
      name: "createSwitch";
      accounts: [
        {
          name: "owner";
          isMut: true;
          isSigner: true;
        },
        {
          name: "switch";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "deadline";
          type: "i64";
        },
        {
          name: "beneficiary";
          type: "publicKey";
        },
        {
          name: "seed";
          type: "string";
        }
      ];
    },
    {
      name: "checkIn";
      accounts: [
        {
          name: "owner";
          isMut: false;
          isSigner: true;
        },
        {
          name: "switch";
          isMut: true;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "newDeadline";
          type: "i64";
        }
      ];
    },
    {
      name: "executeTransfer";
      accounts: [
        {
          name: "switch";
          isMut: true;
          isSigner: false
        },
        {
          name: "owner";
          isMut: true;
          isSigner: false
        },
        {
          name: "beneficiary";
          isMut: true;
          isSigner: false
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: "cancelSwitch";
      accounts: [
        {
          name: "owner";
          isMut: true;
          isSigner: true;
        },
        {
          name: "switch";
          isMut: true;
          isSigner: false;
        }
      ],
      args: []
    },
    {
      name: "depositFunds";
      accounts: [
        {
          name: "owner";
          isMut: true;
          isSigner: true;
        },
        {
          name: "switch";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ],
      args: [
        {
          name: "amount";
          type: "u64";
        }
      ]
    },
    {
      name: "updateActivity";
      accounts: [
        {
          name: "owner";
          isMut: false;
          isSigner: true;
        },
        {
          name: "switch";
          isMut: true;
          isSigner: false;
        }
      ],
      args: []
    }
  ];
  accounts: [
    {
      name: "deadManSwitch";
      type: {
        kind: "struct";
        fields: [
          {
            name: "owner";
            type: "publicKey";
          },
          {
            name: "beneficiary";
            type: "publicKey";
          },
          {
            name: "deadline";
            type: "i64";
          },
          {
            name: "isActive";
            type: "bool";
          },
          {
            name: "bump",
            type: "u8";
          },
          {
            name: "seed",
            type: "string"
          },
          {
            name: "balance",
            type: "u64"
          },
          {
            name: "lastActivity",
            type: "i64"
          }
        ];
      };
    }
  ];
} & Idl;

export const IDL: DeadManSwitchIDL = {
  version: "0.1.0",
  name: "dead_man_switch",
  instructions: [
    {
      name: "createSwitch",
      accounts: [
        {
          name: "owner",
          isMut: true,
          isSigner: true
        },
        {
          name: "switch",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "deadline",
          type: "i64"
        },
        {
          name: "beneficiary",
          type: "publicKey"
        },
        {
          name: "seed",
          type: "string"
        }
      ]
    },
    {
      name: "checkIn",
      accounts: [
        {
          name: "owner",
          isMut: false,
          isSigner: true
        },
        {
          name: "switch",
          isMut: true,
          isSigner: false
        }
      ],
      args: [
        {
          name: "newDeadline",
          type: "i64"
        }
      ]
    },
    {
      name: "executeTransfer",
      accounts: [
        {
          name: "switch",
          isMut: true,
          isSigner: false
        },
        {
          name: "owner",
          isMut: true,
          isSigner: false
        },
        {
          name: "beneficiary",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: "cancelSwitch",
      accounts: [
        {
          name: "owner",
          isMut: true,
          isSigner: true
        },
        {
          name: "switch",
          isMut: true,
          isSigner: false
        }
      ],
      args: []
    },
    {
      name: "depositFunds",
      accounts: [
        {
          name: "owner",
          isMut: true,
          isSigner: true
        },
        {
          name: "switch",
          isMut: true,
          isSigner: false
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "amount",
          type: "u64"
        }
      ]
    },
    {
      name: "updateActivity",
      accounts: [
        {
          name: "owner",
          isMut: false,
          isSigner: true
        },
        {
          name: "switch",
          isMut: true,
          isSigner: false
        }
      ],
      args: []
    }
  ],
  accounts: [
    {
      name: "deadManSwitch",
      type: {
        kind: "struct",
        fields: [
          {
            name: "owner",
            type: "publicKey"
          },
          {
            name: "beneficiary",
            type: "publicKey"
          },
          {
            name: "deadline",
            type: "i64"
          },
          {
            name: "isActive",
            type: "bool"
          },
          {
            name: "bump",
            type: "u8"
          },
          {
            name: "seed",
            type: "string"
          },
          {
            name: "balance",
            type: "u64"
          },
          {
            name: "lastActivity",
            type: "i64"
          }
        ]
      }
    }
  ]
} as const; 