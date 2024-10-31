export const operationEnumToString = (op: number | null) => {
  switch(op){
    case 0:
      return "Mint";
    case 1:
      return "Burn";
    case 2:
      return "PostLaunch";
    case 3:
      return "Pause";
    case 4:
      return "Unpause";
    case 5:
      return "SetBridgeInCaller";
    case 6:
      return "SetBridgeInLimits";
    case 7:
      return "UpdateSigner";
    case 8:
      return "Distribute";
    default:
      return "Select Operation";
  }
}
