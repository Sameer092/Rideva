import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { connect } from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import colors from '@colors';
import { Bold, Regular } from '@fonts';
import { wp, hp } from '@utils/utilities';
import { Button } from '@components/common';
import * as RideActions from '@store/Ride/actions';
import * as LoaderActions from '@store/Loader/actions';

const LABELS = ['', 'Poor', 'Okay', 'Good', 'Great', 'Excellent'];

let enhancer = connect(
  (state) => ({ user: state.Auth.auth.get('user') }),
  { ...RideActions, ...LoaderActions },
);

function Rate({ navigation, route, user, rate, showHUD, hideHUD }) {
  const { rideId, rateeId } = route.params;
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');

  const submit = async () => {
    showHUD();
    try {
      await rate(rideId, user.id, rateeId, score, comment);
      navigation.popToTop();
    } catch (e) {
      Alert.alert('Error', e.message || 'Could not submit rating');
    } finally {
      hideHUD();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.iconBox}>
          <Icon name="star" size={wp(11)} color={colors.golden} />
        </View>
        <Text style={styles.title}>How was your ride?</Text>
        <Text style={styles.subtitle}>Your feedback keeps Rideva great</Text>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setScore(s)}>
              <Icon name={s <= score ? 'star' : 'star-outline'} size={wp(10)} color={s <= score ? colors.golden : colors.placeholder} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>{LABELS[score]}</Text>

        <TextInput
          style={styles.input}
          placeholder="Add a comment (optional)"
          placeholderTextColor={colors.placeholder}
          value={comment}
          onChangeText={setComment}
          multiline
        />

        <Button label="Submit rating" onPress={submit} buttonStyle={styles.btn} />
        <TouchableOpacity style={styles.skip} onPress={() => navigation.popToTop()}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default enhancer(Rate);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  body: {
    flex: 1,
    padding: wp(6),
    justifyContent: 'center'
  },
  iconBox: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: hp(2)
  },
  title: {
    fontWeight: Bold,
    fontSize: wp(6),
    color: colors.txtDark,
    textAlign: 'center'
  },
  subtitle: {
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.txtSecondary,
    textAlign: 'center',
    marginBottom: hp(3)
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: wp(2)
  },
  label: {
    fontWeight: Bold,
    fontSize: wp(4.4),
    color: colors.primary,
    textAlign: 'center',
    marginTop: hp(1.5),
    marginBottom: hp(2)
  },
  input: {
    minHeight: hp(12),
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: wp(3.5),
    padding: wp(4),
    fontWeight: Regular,
    fontSize: wp(3.8),
    color: colors.txtDark,
    textAlignVertical: 'top',
    marginBottom: hp(2)
  },
  btn: {},
  skip: {
    alignSelf: 'center',
    marginTop: hp(1.5)
  },
  skipText: {
    fontWeight: Regular,
    fontSize: wp(3.6),
    color: colors.txtSecondary
  }
});
