import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const OnBording = () => {
  return (
    <View>
      <Link href="/Home" >
      <Text>OnBording</Text>
      </Link>
    </View>
  )
}

export default OnBording

const styles = StyleSheet.create({})

//imp , sabse pehla ye file load hoga 
