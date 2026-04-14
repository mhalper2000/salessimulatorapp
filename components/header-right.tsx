import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Popover from "react-native-popover-view";
import { Placement } from "react-native-popover-view/dist/Types";
const gearIcon = require("../assets/images/gear.png");

type Props = {
  handleLogout: () => void;
  handleDelete: () => void;
};

const RightHeader: React.FC<Props> = ({ handleLogout, handleDelete }) => {
  const [showPopup, setShowPopup] = useState(false);

  /* ============================
     ACTIONS
  ============================ */
  const confirmDeleteAccount = useCallback(() => {
    setShowPopup(false);
    Alert.alert(
      "Sales Simulator",
      "Are you sure want to delete your account permanently?",
      [
        { text: "Yes", onPress: handleDelete },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  }, [handleDelete]);

  const buttonRef = useRef(null);
  /* ============================
     RENDER
  ============================ */
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setShowPopup((s) => !s)} ref={buttonRef}>
        <Image source={gearIcon} style={styles.settingIcon} />
      </TouchableOpacity>
      <Popover
        isVisible={showPopup}
        onRequestClose={() => setShowPopup(false)}
        from={buttonRef}
        placement={Placement.BOTTOM}
        popoverStyle={{ borderRadius: 8 }}
        // arrowStyle etc.
      >
        <View style={{ padding: 16 }}>
          <View style={styles.deleteButton}>
            <TouchableOpacity
              onPress={confirmDeleteAccount}
              style={styles.popupActionButton}
            >
              <Text style={styles.settingPopupText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.logoutButton}>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.popupActionButton}
            >
              <Text style={styles.settingPopupText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Popover>
    </View>
  );
};

export default RightHeader;

const styles = StyleSheet.create({
  container: {
    display: "flex",
    // flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    // marginTop: 50,
    position: "relative",
    paddingHorizontal: 8,
    height: 40,
  },
  profileContainer: {
    display: "flex",
    flexDirection: "column",
    marginRight: 6,
    marginLeft: 6,
  },
  profileInfo: {
    color: "#fff",
    marginRight: 10,
    fontSize: 15,
    fontWeight: "700",
  },
  settingIcon: {
    marginHorizontal: 5,
    // tintColor: '#DF0000',
  },
  settingPopup: {
    zIndex: 9999,
    backgroundColor: "#FFFFFF",
    minHeight: 70,
    width: 160,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    position: "absolute",
    top: 40,
    right: 0,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  settingPopupText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  logoutButton: {
    height: 30,
    marginTop: 6,
    zIndex: 9999,
  },

  deleteButton: {
    height: 34,
  },
  popupActionButton: {
    // display: 'flex',
    // flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
  },

  settingBtn: {
    borderStyle: "solid",
    borderBottomColor: "#C0C0C0",
    borderRightColor: "#FFFFFF",
    borderTopColor: "#FFFFFF",
    borderLeftColor: "#FFFFFF",
    borderBottomWidth: 0.8,
  },
});
