import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AntDesign, FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

const Home = () => {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const navigation = useNavigation();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const expensesRef = collection(db, "users", user.uid, "expenses");
    const q = query(expensesRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        description: doc.data().description,
        value: doc.data().value,
        date: doc.data().date,
        ...Object.fromEntries(
          Object.entries(doc.data()).filter(([key]) => key !== "id")
        ),
      }));

      setExpenses(data);

      const totalValue = data.reduce((acc, cur) => acc + (cur.value || 0), 0);
      setTotal(totalValue);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "users", user.uid, "expenses", id));
    } catch (error) {
      Alert.alert("Erro", "Não foi possível excluir o gasto.");
      console.error("Erro ao excluir:", error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.expenseItem}>
      <View>
        <Text style={styles.expenseDesc}>{item.description}</Text>
        <Text style={styles.expenseDate}>
          {item.date instanceof Date
            ? item.date.toLocaleDateString()
            : item.date?.toDate?.()?.toLocaleDateString() || "Sem data"}
        </Text>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.expenseValue}>R$ {item.value?.toFixed(2)}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() => {
              if (item.id) {
                navigation.navigate('Edit', { id: item.id });
              } else {
                Alert.alert(
                  "Erro",
                  "Este item não possui um ID válido e não pode ser editado."
                );
              }
            }}
            style={{ marginRight: 12 }}
          >
            <FontAwesome name="edit" size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <FontAwesome name="trash" size={20} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>Controle de Gastos</Text>
        <TouchableOpacity
          style={styles.accountButton}
          onPress={() => navigation.navigate('Account')}
        >
          <Text style={styles.accountText}>Minha Conta</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.header}>Total de Gastos</Text>
        <Text style={styles.total}>R$ {total.toFixed(2)}</Text>
      </View>

      <FlatList
        data={expenses}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('Add')}
      >
        <AntDesign name="pluscircle" size={52} color="#3b82f6" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  accountButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  accountText: {
    color: "#fff",
    fontWeight: "bold",
  },
  totalContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
  },
  total: {
    fontSize: 24,
    color: "#16a34a",
    fontWeight: "bold",
    marginTop: 4,
  },
  list: {
    paddingBottom: 80,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f1f5f9",
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
  },
  expenseDesc: {
    fontSize: 16,
    fontWeight: "bold",
  },
  expenseDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  expenseValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#dc2626",
  },
  rightSection: {
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 6,
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
  },
});

export default Home;