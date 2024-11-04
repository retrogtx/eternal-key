import { Idl } from '@coral-xyz/anchor';

export type DeadManSwitchIDL = {
  version: "0.1.0";
  name: "dead_man_switch";
  instructions: [
    {
      name: "initialize";
      accounts: [
        {
          name: "owner";
          isMut: true;
          isSigner: true;
        },
        {
          name: "switch";
          isMut: true;
          isSigner: true;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "beneficiary";
          type: "publicKey";
        },
        {
          name: "deadline";
          type: "i64";
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
      name: "verifyDeadline";
      accounts: [
        {
          name: "switch";
          isMut: true;
          isSigner: false;
        },
        {
          name: "beneficiary";
          isMut: false;
          isSigner: true;
        }
      ];
      args: [];
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
      name: "initialize",
      accounts: [
        {
          name: "owner",
          isMut: true,
          isSigner: true
        },
        {
          name: "switch",
          isMut: true,
          isSigner: true
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false
        }
      ],
      args: [
        {
          name: "beneficiary",
          type: "publicKey"
        },
        {
          name: "deadline",
          type: "i64"
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
      name: "verifyDeadline",
      accounts: [
        {
          name: "switch",
          isMut: true,
          isSigner: false
        },
        {
          name: "beneficiary",
          isMut: false,
          isSigner: true
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
          }
        ]
      }
    }
  ]
} as const; 